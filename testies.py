#!/usr/bin/env python3

import os
import re
from statistics import mean, median

FEC_DIR = "~/TEST_3_4_25/congress_members_fec"

CURRENT_STAT_FIELDS = [
    "Total Receipts",
    "Total Individual Contributions",
    "Transfers from Authorized Committees",
    "Transfers to Authorized Committees",
    "Contributions from Other Political Committees",
    "Contributions from Party Committees",
    "Contributions from Candidate",
    "Loans from Candidate",
    "Beginning Cash",
    "Ending Cash",
    "Debts Owed By"
]

def parse_dollar_amount(value):
    match = re.match(r"^\s*\$?\s*([\d,]+\.?\d*)", value.strip())
    return float(match.group(1).replace(',', '')) if match else 0.0

def analyze_fec_data(directory):
    stats = {field: [] for field in CURRENT_STAT_FIELDS}
    stats["Career Total Receipts"] = []
    
    directory = os.path.expanduser(directory)
    files_processed = 0
    
    for filename in os.listdir(directory):
        if not filename.endswith(".txt"):
            continue
            
        files_processed += 1
        filepath = os.path.join(directory, filename)
        card_data = {field: 0.0 for field in CURRENT_STAT_FIELDS + ["Career Total Receipts"]}
        
        with open(filepath, 'r') as f:
            content = f.read()
            lines = content.split('\n')
            in_current_stats = False
            in_career_stats = False
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Section transitions
                if "URL" in line:
                    in_current_stats = True
                    continue
                elif "Career Stats" in line:
                    in_current_stats = False
                    in_career_stats = True
                    continue
                elif "Yearly Totals" in line:
                    in_career_stats = False
                    continue
                    
                if ':' not in line:
                    continue
                    
                # Current Stats (split on $)
                if in_current_stats and '$' in line:
                    parts = line.split('$', 1)
                    key = parts[0].strip()
                    value = '$' + parts[1].split('(Rank')[0].strip()
                    
                    if key in CURRENT_STAT_FIELDS:
                        amount = parse_dollar_amount(value)
                        card_data[key] = amount
                        # print(f"Debug: {filename} - Matched {key}: ${amount:,.2f}")
                
                # Career Stats (split on :)
                elif in_career_stats and ':' in line:
                    key, value = [part.strip() for part in line.split(':', 1)]
                    if key == "Total Receipts":
                        amount = parse_dollar_amount(value)
                        card_data["Career Total Receipts"] = amount
                        # print(f"Debug: {filename} - Matched Career Total Receipts: ${amount:,.2f}")
        
        for field in CURRENT_STAT_FIELDS:
            stats[field].append(card_data[field])
        stats["Career Total Receipts"].append(card_data["Career Total Receipts"])
    
    print(f"Debug: Processed {files_processed} files")
    return stats

def print_summary(stats):
    print("=== Raw FEC Data Overview ===")
    print(f"Total Cards: {len(stats['Total Receipts'])}")
    
    print("\nCurrent Stats (2023-2024):")
    for field in CURRENT_STAT_FIELDS:
        values = stats[field]
        print(f"\n{field}:")
        print(f"  Min: ${min(values):,.2f}")
        print(f"  Max: ${max(values):,.2f}")
        print(f"  Average: ${mean(values):,.2f}")
        print(f"  Median: ${median(values):,.2f}")
    
    print("\nCareer Stats:")
    values = stats["Career Total Receipts"]
    print(f"Total Receipts:")
    print(f"  Min: ${min(values):,.2f}")
    print(f"  Max: ${max(values):,.2f}")
    print(f"  Average: ${mean(values):,.2f}")
    print(f"  Median: ${median(values):,.2f}")

if __name__ == "__main__":
    stats = analyze_fec_data(FEC_DIR)
    print_summary(stats)
