#!/usr/bin/env python3
from dotenv import load_dotenv
load_dotenv()
import os
from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), base_url=os.getenv("OPENAI_BASE_URL"))
models = client.models.list()
for m in sorted(models.data, key=lambda x: x.id):
    if "flash" in m.id or "2.5" in m.id:
        print(m.id)
