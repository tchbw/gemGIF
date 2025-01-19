import sys
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile

sys.path.append(str(Path(__file__).parent))
from main import download_video_from_url, generate_timecode_caption

app = FastAPI()


@app.post("/generate_timecode_captions/")
async def generate_timecode_captions(url: str):
    try:
        # Create videos directory
        videos_dir = Path(__file__).parent / "videos"
        videos_dir.mkdir(exist_ok=True)

        # Download the video
        video_path = download_video_from_url(
            url, local_path=str(videos_dir / f"downloaded_video_{int(time.time())}.mp4")
        )

        # Generate timecode captions
        captions = generate_timecode_caption(Path(video_path))

        try:
            Path(video_path).unlink(missing_ok=True)
        except Exception as cleanup_error:
            print(f"Could not remove temporary video file: {cleanup_error}")

        return {
            "video_url": url,
            "file_path": video_path,
            "captions": [caption.model_dump() for caption in captions],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/uploadfile/")
async def upload_video_file(file: UploadFile):
    # Create videos directory
    videos_dir = Path(__file__).parent / "videos"
    videos_dir.mkdir(exist_ok=True)

    # Save the file
    file_path = videos_dir / file.filename
    try:
        # Write file contents
        with file_path.open("wb") as buffer:
            contents = await file.read()
            buffer.write(contents)

        # Process the file
        captions = generate_timecode_caption(file_path)

        return {
            "filename": file.filename,
            "file_path": str(file_path),
            "captions": [caption.model_dump() for caption in captions],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
