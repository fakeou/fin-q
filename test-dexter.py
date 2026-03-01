#!/usr/bin/env python3
"""
Phase 1 验证：测试 Dexter 能否正常运行
运行方式：.venv/bin/python test-dexter.py
"""
import sys
import os

# 加载 .env
from dotenv import load_dotenv
load_dotenv()

# 验证环境变量
openai_key = os.getenv("OPENAI_API_KEY")
fin_key = os.getenv("FINANCIAL_DATASETS_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")

print(f"OPENAI_API_KEY:            {'✓ set' if openai_key else '✗ missing'}")
print(f"OPENAI_BASE_URL:           {base_url or '(default openai.com)'}")
print(f"FINANCIAL_DATASETS_API_KEY: {'✓ set' if fin_key else '✗ missing'}")
print()

if not openai_key:
    print("ERROR: OPENAI_API_KEY is required")
    sys.exit(1)

print("Loading Dexter agent...")
from dexter.agent import Agent

agent = Agent()
print("Agent created. Running test query...\n")
print("=" * 60)

answer = agent.run("What is Apple's (AAPL) latest annual revenue?")

print("=" * 60)
print("\n[test-dexter.py] Final answer returned:")
print(answer)
