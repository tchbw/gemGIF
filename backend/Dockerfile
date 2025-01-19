# Use the official AWS Lambda Python base image
FROM public.ecr.aws/lambda/python:3.11

# Set environment variables
ENV AWS_DEFAULT_REGION=us-east-1

RUN yum install wget tar xz -y

# Install ffmpeg directly
RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
    tar xf ffmpeg-release-amd64-static.tar.xz && \
    mv ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ && \
    chmod +x /usr/local/bin/ffmpeg && \
    rm -rf ffmpeg-*-amd64-static*  # Moved rm command to the same RUN block

# Set the working directory
WORKDIR /var/task

# Copy requirements and install them
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy the FastAPI app code to the container
COPY main.py .

CMD ["main.handler"]
