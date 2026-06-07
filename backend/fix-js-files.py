#!/usr/bin/env python3
import re

files_to_fix = [
    '/workspace/backend/scripts/migrate-sqlite-to-mysql.js',
    '/workspace/backend/setup-mysql.js',
    '/workspace/backend/setup-mysql-simple.js',
    '/workspace/backend/init-mysql.js',
    '/workspace/backend/init-mysql-minimal.js',
    '/workspace/backend/test-mysql-init.js'
]

replacements = [
    ('&lt;', '<'),
    ('&gt;', '>'),
    ('&amp;', '&'),
    ('=&gt;', '=>'),
    ('&amp;&amp;', '&&'),
]

for filepath in files_to_fix:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for old, new in replacements:
            content = content.replace(old, new)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed: {filepath}')
        else:
            print(f'No changes: {filepath}')
    except FileNotFoundError:
        print(f'Not found: {filepath}')
    except Exception as e:
        print(f'Error {filepath}: {e}')

print('Done!')
