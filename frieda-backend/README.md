## Setup

1. Create a virtual environment

    ```shell
    uv venv
    ```

2. Activate the virtual environment

-   On macOS/Linux:

    ```shell
    source .venv/bin/activate
    ```

-   On Windows:

    ```shell
    .\.venv\Scripts\Activate.ps1
    ```

3. Install Dependencies

    ```shell
    uv sync
    ```

**Note**: Always activate the virtual environment before running commands like `uv sync` or `pytest`.
