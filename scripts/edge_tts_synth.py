import asyncio
import sys
import edge_tts

DEFAULT_VOICE = "en-US-ChristopherNeural"

async def main():
    if len(sys.argv) < 2:
        sys.exit(1)
    text = sys.argv[1].strip()
    voice = sys.argv[2].strip() if len(sys.argv) > 2 and sys.argv[2].strip() else DEFAULT_VOICE

    if not text:
        sys.exit(0)

    try:
        communicate = edge_tts.Communicate(text, voice)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                sys.stdout.buffer.write(chunk["data"])
        sys.stdout.buffer.flush()
    except Exception as e:
        sys.stderr.write(f"TTS Error: {e}\n")
        sys.exit(2)

if __name__ == "__main__":
    asyncio.run(main())
