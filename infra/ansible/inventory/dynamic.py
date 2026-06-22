#!/usr/bin/env python3
"""Dynamic Ansible inventory from Terraform outputs."""

import json
import sys

def main():
    with open('tf_outputs.json') as f:
        tf = json.load(f)

    inventory = {
        'all': {
            'hosts': [],
            'vars': {
                'ansible_ssh_private_key_file': '~/.ssh/ecom-key.pem',
            }
        },
        'api_servers': {
            'hosts': tf.get('api_private_ips', {}).get('value', []),
        },
        'db_servers': {
            'hosts': [tf.get('db_endpoint', {}).get('value', '')],
            'vars': {
                'db_port': tf.get('db_port', {}).get('value', 5432),
            }
        },
        '_meta': {
            'hostvars': {}
        }
    }

    print(json.dumps(inventory, indent=2))

if __name__ == '__main__':
    main()