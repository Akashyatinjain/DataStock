import json

transcript_path = r"C:\Users\Akash\.gemini\antigravity-ide\brain\365dfb82-1719-47d7-a4ab-725e84d1c689\.system_generated\logs\transcript.jsonl"

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'browser_subagent' in line:
            obj = json.loads(line)
            print(json.dumps(obj, indent=2))
