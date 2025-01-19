import json
import os
import time
import urllib.request
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel
from rich import print

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)


class TimecodeCaption(BaseModel):
    start_time: str
    end_time: str
    caption: str


def upload_video(video_file_name):
    video_file = client.files.upload(path=video_file_name)

    while video_file.state == "PROCESSING":
        print("Waiting for video to be processed.")
        time.sleep(10)
        video_file = client.files.get(name=video_file.name)

    if video_file.state == "FAILED":
        raise ValueError(video_file.state)
    print(f"Video processing complete: " + video_file.uri)

    return video_file


def call_gemini_model(video):
    model_name = "gemini-2.0-flash-exp"
    prompt = """
    Analyze the video and break it down into distinct scenes with precise timecodes.

    For each scene, provide:
    1. Start Time: Exact moment the scene begins (in MM:SS format)
    2. End Time: Exact moment the scene concludes (in MM:SS format)
    3. Caption: A concise, informative description of the scene's content

    Guidelines:
    - Use strict MM:SS format (e.g., "00:08", "01:25")
    - Ensure timecodes are sequential and accurate
    - Capture the essence of each scene in the caption
    """

    response = client.models.generate_content(
        model=model_name,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_uri(file_uri=video.uri, mime_type=video.mime_type),
                ],
            ),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema={
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "start_time": {"type": "string"},
                        "end_time": {"type": "string"},
                        "caption": {"type": "string"},
                    },
                    "required": ["start_time", "end_time", "caption"],
                },
            },
        ),
    )
    return response


def generate_timecode_caption(video_file: Path) -> List[TimecodeCaption]:
    uploaded_video = upload_video(video_file)
    response = call_gemini_model(uploaded_video)

    try:
        captions = response.candidates[0].content.parts[0].text
        parsed_captions = json.loads(captions)
        return [TimecodeCaption(**caption) for caption in parsed_captions]
    except Exception as e:
        print(f"Error parsing response: {e}")
        return []


def download_video_from_url(video_url: str, local_path: str = None) -> str:
    """
    Download a video from a direct URL.

    Args:
        video_url (str): Direct URL to the video
        local_path (str, optional): Local path to save the video

    Returns:
        str: Path to the downloaded video
    """
    try:
        # Determine local file path
        if local_path is None:
            local_path = os.path.basename(urllib.parse.urlparse(video_url).path)

        # Ensure directory exists
        Path(local_path).parent.mkdir(parents=True, exist_ok=True)

        # Download with progress
        print(f"Downloading video from {video_url}...")
        urllib.request.urlretrieve(video_url, local_path)

        print(f"Successfully downloaded to {local_path}")
        return local_path

    except Exception as e:
        print(f"Download error: {e}")
        raise


# # Usage
# print("Starting...")
# videos_path = Path(__file__).parent / "videos"
# video_file_jdvance = videos_path / "jdvance_debate_immigration.mp4"
# video_file_trump = videos_path / "trump_victory_2024.mp4"
# generate_timecode_caption(video_file_trump)
# print("Complete!")
