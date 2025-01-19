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
    start_time: int
    end_time: int
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


def call_gemini_model(video, user_query: str):
    model_name = "gemini-2.0-flash-exp"
    prompt = f"""
    Task: Select the Most Representative Video Scene for a GIF

    Creative Brief: {user_query}

    Instructions:
    - Find ONE scene that best captures the user's intent
    - Select a 2-5 second segment with:
      1. Clear, dynamic motion
      2. Maximum visual impact
      3. Direct alignment with the creative description

    Output Format:
    ```json
    {{
      "start_time": "MM:SS",
      "end_time": "MM:SS",
      "caption": "Funny GIF Caption"
    }}
    ```"""

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


def convert_mmss_to_seconds(time_str: str) -> int:
    """
    Convert MM:SS format to total seconds.

    Args:
        time_str (str): Time in MM:SS format (e.g., "01:25")

    Returns:
        int: Total number of seconds
    """
    minutes, seconds = map(int, time_str.split(":"))
    return minutes * 60 + seconds


def generate_timecode_caption(
    video_file: Path, user_query: str
) -> List[TimecodeCaption]:
    uploaded_video = upload_video(video_file)
    response = call_gemini_model(uploaded_video, user_query)

    try:
        captions = response.candidates[0].content.parts[0].text
        parsed_captions = json.loads(captions)

        # Convert MM:SS to seconds for start_time and end_time
        converted_captions = []
        for caption in parsed_captions:
            converted_caption = {
                "start_time": convert_mmss_to_seconds(caption["start_time"]),
                "end_time": convert_mmss_to_seconds(caption["end_time"]),
                "caption": caption["caption"],
            }
            converted_captions.append(TimecodeCaption(**converted_caption))

        return converted_captions
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
