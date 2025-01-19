import os
import hashlib
import yt_dlp
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from mangum import Mangum
import moviepy as mp
import moviepy.config as mpc  # Added
import boto3
from urllib.parse import urlparse, parse_qs
import tempfile  # Added

# Environment variables or hard-coded bucket names
VIDEO_S3_BUCKET = os.getenv("VIDEO_S3_BUCKET", "hackathon-agi-house-videos")
GIF_S3_BUCKET = os.getenv("GIF_S3_BUCKET", "hackathon-agi-house-gifs")

app = FastAPI()
s3_client = boto3.client("s3")

# ----------- Models -----------

class DownloadRequest(BaseModel):
    url: str
    start_time: Optional[int] = None
    end_time: Optional[int] = None

# ----------- Helper Functions -----------

def generate_s3_key(url: str,
                    start_time: Optional[int] = None,
                    end_time: Optional[int] = None,
                    extension: str = ".mp4") -> str:
    """
    Generate an S3 key based on the SHA256 of:
     - the YouTube URL
     - the start_time and end_time (if provided)
    """
    unique_str = url
    if start_time is not None:
        unique_str += f"_{start_time}"
    if end_time is not None:
        unique_str += f"_{end_time}"
    sha_hash = hashlib.sha256(unique_str.encode("utf-8")).hexdigest()
    return sha_hash + extension


def download_video_segment(url: str, start_time: Optional[int],
                           end_time: Optional[int], output_path: str) -> None:
    """
    Downloads a segment of the video from `start_time` to `end_time`.
    If start_time and end_time are not provided, the entire video is downloaded.
    """
    ydl_opts: Dict[str, Any] = {
        'format': 'mp4',
        'outtmpl': output_path,
    }

    # Only use 'download_ranges' if both times are specified
    if start_time is not None and end_time is not None:
        ydl_opts['download_ranges'] = lambda info_dict, ydl: [{
            'start_time': start_time,
            'end_time': end_time
        }]

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

# Configure MoviePy to use the updated FFMPEG binary
mpc.FFMPEG_BINARY = "/usr/local/bin/ffmpeg"  # Changed

# ----------- Routes -----------

@app.post("/video")
def download_handler(request: DownloadRequest) -> Dict[str, str]:
    """
    Endpoint to download a segment of the video from `start_time` to `end_time`.
    If `start_time` and `end_time` are not provided, the entire video is downloaded.
    Then uploads the downloaded video and the converted GIF to S3.
    """
    try:
        # Generate S3 key for video
        video_key = generate_s3_key(
            url=request.url,
            start_time=request.start_time,
            end_time=request.end_time,
            extension=".mp4"
        )

        # Check if video already exists in S3
        try:
            s3_client.head_object(Bucket=VIDEO_S3_BUCKET, Key=video_key)
            video_exists = True
        except Exception:
            video_exists = False

        # Use temporary file instead of tmp directory
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_video:
            local_video_path = tmp_video.name
            print(local_video_path)

        if not video_exists:
            download_video_segment(
                url=request.url,
                start_time=request.start_time,
                end_time=request.end_time,
                output_path=local_video_path
            )

            # Upload the video to S3
            s3_client.upload_file(local_video_path, VIDEO_S3_BUCKET, video_key)
        else:
            # Download the existing video from S3
            s3_client.download_file(VIDEO_S3_BUCKET, video_key, local_video_path)

        # Convert the video to GIF
        local_gif_path = os.path.splitext(local_video_path)[0] + ".gif"
        clip = mp.VideoFileClip(local_video_path)
        clip.write_gif(local_gif_path)
        clip.close()

        # Generate S3 key for GIF
        gif_key = generate_s3_key(
            url=request.url,
            start_time=request.start_time,
            end_time=request.end_time,
            extension=".gif"
        )

        # Check if GIF already exists in S3
        try:
            s3_client.head_object(Bucket=GIF_S3_BUCKET, Key=gif_key)
            gif_exists = True
        except Exception:
            gif_exists = False

        if not gif_exists:
            # Upload the GIF to S3
            s3_client.upload_file(local_gif_path, GIF_S3_BUCKET, gif_key)

        return {
            "status": "success",
            "message": "Video segment downloaded and GIF created successfully.",
            "video_s3_bucket": VIDEO_S3_BUCKET,
            "video_s3_key": video_key,
            "gif_s3_bucket": GIF_S3_BUCKET,
            "gif_s3_key": gif_key,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
