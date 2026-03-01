#!/usr/bin/env python3
"""
代理连通性快速验证
"""
from dotenv import load_dotenv
load_dotenv()

import os
from openai import OpenAI

key = os.getenv("OPENAI_API_KEY")
base = os.getenv("OPENAI_BASE_URL")
model = os.getenv("MODEL_NAME", "gpt-4o")
print(f"OPENAI_API_KEY:   {'✓ set' if key else '✗ missing'}")
print(f"OPENAI_BASE_URL:  {base or '(official openai.com)'}")
print(f"MODEL_NAME:       {model}\n")

client = OpenAI(api_key=key, **({"base_url": base} if base else {}))

print(f"Testing basic chat ({model})...")
try:
    r = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "Reply with exactly: OK"}],
        max_tokens=5,
    )
    print(f"✓ Response: {r.choices[0].message.content}")
except Exception as e:
    print(f"✗ Error: {e}")
