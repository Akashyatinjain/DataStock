import json

transcript_path = r"C:\Users\Akash\.gemini\antigravity-ide\brain\365dfb82-1719-47d7-a4ab-725e84d1c689\.system_generated\logs\transcript_full.jsonl"

with open(transcript_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'capture_browser_console_logs' in line:
            obj = json.loads(line)
            print(f"--- Line {i+1} ---")
            print(json.dumps(obj, indent=2)[:2000]) # Print first 2000 chars of step
