import os

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
with open(env_path, 'r') as f:
    content = f.read()

# Remove stray markdown code blocks and duplicate sentry URLs
lines = content.split('\n')
cleaned = []
for line in lines:
    if line.strip().startswith('```'):
        continue
    if line.strip().startswith('https://225853ffed006472793846a42689e9b2@'):
        continue
    cleaned.append(line)

result = '\n'.join(cleaned)
with open(env_path, 'w') as f:
    f.write(result)

print(f"Cleaned .env.local: {len(lines)} lines -> {len(cleaned)} lines")
