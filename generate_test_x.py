import yaml
import os
from glob import glob
from collections import defaultdict
import re

# Define finance fields mapping
finance_fields = {
    'TTL_RECEIPTS': 'Total Receipts',
    'TRANS_FROM_AUTH': 'Transfers from Authorized Committees',
    'TTL_DISB': 'Total Disbursements',
    'TRANS_TO_AUTH': 'Transfers to Authorized Committees',
    'COH_BOP': 'Beginning Cash',
    'COH_COP': 'Ending Cash',
    'CAND_CONTRIB': 'Contributions from Candidate',
    'CAND_LOANS': 'Loans from Candidate',
    'OTHER_LOANS': 'Other Loans',
    'CAND_LOAN_REPAY': 'Candidate Loan Repayments',
    'OTHER_LOAN_REPAY': 'Other Loan Repayments',
    'DEBTS_OWED_BY': 'Debts Owed By',
    'TTL_INDIV_CONTRIB': 'Total Individual Contributions',
    'OTHER_POL_CMTE_CONTRIB': 'Contributions from Other Political Committees',
    'POL_PTY_CONTRIB': 'Contributions from Party Committees',
    'INDIV_REFUNDS': 'Refunds to Individuals',
    'CMTE_REFUNDS': 'Refunds to Committees'
}

def extract_cycle_start_year(filename):
    match = re.search(r'weball(\d{2})\.txt', filename)
    if match:
        year_suffix = int(match.group(1))
        end_year = 1900 + year_suffix if year_suffix >= 80 else 2000 + year_suffix
        return end_year - 1
    return None

weball_files = sorted(glob('weball*.txt'), key=extract_cycle_start_year)

def parse_weball_file(filepath):
    finance_data = {}
    year = extract_cycle_start_year(filepath)
    try:
        with open(filepath, 'r') as f:
            for line in f:
                cols = line.strip().split('|')
                if len(cols) < 30:
                    continue
                fec_id = cols[0]
                finance_data[fec_id] = {
                    'stats': {
                        'TTL_RECEIPTS': float(cols[5] or '0'),
                        'TRANS_FROM_AUTH': float(cols[6] or '0'),
                        'TTL_DISB': float(cols[7] or '0'),
                        'TRANS_TO_AUTH': float(cols[8] or '0'),
                        'COH_BOP': float(cols[9] or '0'),
                        'COH_COP': float(cols[10] or '0'),
                        'CAND_CONTRIB': float(cols[11] or '0'),
                        'CAND_LOANS': float(cols[12] or '0'),
                        'OTHER_LOANS': float(cols[13] or '0'),
                        'CAND_LOAN_REPAY': float(cols[14] or '0'),
                        'OTHER_LOAN_REPAY': float(cols[15] or '0'),
                        'DEBTS_OWED_BY': float(cols[16] or '0'),
                        'TTL_INDIV_CONTRIB': float(cols[17] or '0'),
                        'OTHER_POL_CMTE_CONTRIB': float(cols[25] or '0'),
                        'POL_PTY_CONTRIB': float(cols[26] or '0'),
                        'INDIV_REFUNDS': float(cols[28] or '0'),
                        'CMTE_REFUNDS': float(cols[29] or '0')
                    },
                    'year': year
                }
        print(f"Processed {filepath} with year {year}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
    return finance_data

def aggregate_finance_data(legislators):
    all_finance_data = defaultdict(lambda: {'stats': defaultdict(float), 'years': set()})
    
    print(f"Found {len(weball_files)} weball files: {weball_files}")
    if not weball_files:
        print("No weball files found, returning empty data")
        return (all_finance_data, {}, None, None, 2023, 2024, {}, {})
    
    current_cycle_file = 'weball24.txt'
    current_cycle_data = {}
    if os.path.exists(current_cycle_file):
        current_cycle_data = parse_weball_file(current_cycle_file)
    else:
        print(f"Warning: {current_cycle_file} not found. No current cycle data will be available.")
    
    for filepath in weball_files:
        file_data = parse_weball_file(filepath)
        for fec_id, data in file_data.items():
            for key, value in data['stats'].items():
                all_finance_data[fec_id]['stats'][key] += value
            all_finance_data[fec_id]['years'].add(data['year'])
    
    all_years = {y for d in all_finance_data.values() for y in d['years']}
    global_min_year = min(all_years) if all_years else None
    global_max_end_year = max(y + 1 for y in all_years) if all_years else None
    
    current_cycle_start_year = 2023
    current_cycle_end_year = 2024

    current_stats = defaultdict(list)
    cumulative_stats = defaultdict(list)

    for member in legislators:
        fec_ids = member.get('id', {}).get('fec', [])
        full_name = f"{member.get('name', {}).get('first', '')} " \
                    f"{member.get('name', {}).get('middle', '')} " \
                    f"{member.get('name', {}).get('last', '')}".strip()
        
        current_candidate_stats = defaultdict(float)
        for fec_id in fec_ids:
            if fec_id in current_cycle_data:
                for key, value in current_cycle_data[fec_id]['stats'].items():
                    current_candidate_stats[key] += value
        for key, value in current_candidate_stats.items():
            if value != 0:
                current_stats[finance_fields[key]].append((full_name, value))
        
        cumulative_candidate_stats = defaultdict(float)
        for fec_id in fec_ids:
            if fec_id in all_finance_data:
                for key, value in all_finance_data[fec_id]['stats'].items():
                    cumulative_candidate_stats[key] += value
        for key, value in cumulative_candidate_stats.items():
            if value != 0:
                cumulative_stats[finance_fields[key]].append((full_name, value))

    def compute_rankings(data_dict):
        rankings = {}
        for cat in finance_fields.values():
            if cat in data_dict:
                ranked = sorted(data_dict[cat], key=lambda x: x[1], reverse=True)
                rankings[cat] = {name: i + 1 for i, (name, _) in enumerate(ranked)}
        return rankings

    current_rankings = compute_rankings(current_stats)
    cumulative_rankings = compute_rankings(cumulative_stats)

    return (all_finance_data, current_cycle_data, global_min_year, global_max_end_year,
            current_cycle_start_year, current_cycle_end_year, current_rankings, cumulative_rankings)

def main():
    yaml_file_path = "legislators-current.yaml"
    output_dir = "congress_members_fec"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    try:
        with open(yaml_file_path, 'r') as file:
            legislators = yaml.safe_load(file)
        if not isinstance(legislators, list):
            raise ValueError("YAML file should contain a list of legislators.")
        
        result = aggregate_finance_data(legislators)
        if result is None:
            print("aggregate_finance_data returned None, exiting")
            return
        all_finance_data, current_cycle_data, global_min_year, global_max_end_year, \
        current_cycle_start_year, current_cycle_end_year, current_rankings, \
        cumulative_rankings = result
        
        for member in legislators:
            fec_ids = member.get('id', {}).get('fec', [])
            bioguide_id = member.get('id', {}).get('bioguide')
            
            if fec_ids:
                filename_id = "_".join(fec_ids)
            elif bioguide_id:
                filename_id = bioguide_id
            else:
                print(f"Skipping member with no FEC or bioguide ID: {member.get('name', 'Unknown')}")
                continue
            
            output_file = os.path.join(output_dir, f"{filename_id}.txt")
            print(f"Processing: {filename_id}")
            
            with open(output_file, 'w') as txt_file:
                full_name = f"{member.get('name', {}).get('first', '')} " \
                          f"{member.get('name', {}).get('middle', '')} " \
                          f"{member.get('name', {}).get('last', '')}".strip()
                latest_term = member.get('terms', [{}])[-1]
                role = "Senator" if latest_term.get('type') == 'sen' else "Representative"
                
                txt_file.write(f"Full Name: {full_name}\n")
                txt_file.write(f"Role: {role}\n")
                txt_file.write(f"Party: {latest_term.get('party', 'N/A')}\n")
                txt_file.write(f"State: {latest_term.get('state', 'N/A')}\n")
                txt_file.write(f"District: {latest_term.get('district', 'N/A') if role == 'Representative' else 'N/A'}\n")
                txt_file.write(f"Gender: {member.get('bio', {}).get('gender', 'N/A')}\n")
                txt_file.write(f"Birthday: {member.get('bio', {}).get('birthday', 'N/A')}\n")
                txt_file.write(f"FEC ID: {', '.join(fec_ids) if fec_ids else 'None'}\n")
                txt_file.write(f"URL: {latest_term.get('url', 'N/A')}\n\n")
                
                txt_file.write(f"Current Stats ({current_cycle_start_year}-{current_cycle_end_year}):\n")
                current_stats = defaultdict(float)
                for fec_id in fec_ids:
                    if fec_id in current_cycle_data:
                        for key, value in current_cycle_data[fec_id]['stats'].items():
                            current_stats[key] += value
                
                current_fields = [
                    'TTL_RECEIPTS', 'TTL_INDIV_CONTRIB', 'TRANS_FROM_AUTH', 'TRANS_TO_AUTH',
                    'OTHER_POL_CMTE_CONTRIB', 'POL_PTY_CONTRIB', 'CAND_CONTRIB', 'CAND_LOANS',
                    'COH_BOP', 'COH_COP', 'DEBTS_OWED_BY'
                ]
                
                for key in current_fields:
                    value = current_stats[key]
                    cat = finance_fields[key]
                    rank = current_rankings.get(cat, {}).get(full_name, "N/A")
                    txt_file.write(f"{cat:<45} ${value:>13,.2f} (Rank: {rank})\n")
                txt_file.write("\n")
                
                years = set()
                yearly_totals = defaultdict(lambda: defaultdict(float))
                for fec_id in fec_ids:
                    if fec_id in all_finance_data:
                        years.update(all_finance_data[fec_id]['years'])
                        for filepath in weball_files:
                            year = extract_cycle_start_year(filepath)
                            file_data = parse_weball_file(filepath)
                            if fec_id in file_data:
                                yearly_totals[year][fec_id] += file_data[fec_id]['stats']['TTL_RECEIPTS']
                
                min_year = min(years) if years else global_min_year
                max_end_year = max(y + 1 for y in years) if years else global_max_end_year
                
                txt_file.write(f"Career Stats ({min_year}-{max_end_year}):\n")
                total_receipts = sum(sum(fec_dict.values()) for fec_dict in yearly_totals.values())
                rank = cumulative_rankings.get('Total Receipts', {}).get(full_name, "N/A")
                txt_file.write(f"Total Receipts: ${total_receipts:,.2f} (Rank: {rank})\n\n")
                
                if years:
                    txt_file.write("Yearly Totals:\n")
                    sorted_years = sorted(years, reverse=True)
                    for year in sorted_years:
                        total = sum(yearly_totals[year].values())
                        if yearly_totals[year]:
                            primary_fec_id = max(yearly_totals[year], key=yearly_totals[year].get)
                            fec_id_str = primary_fec_id
                        else:
                            fec_id_str = "N/A"
                        txt_file.write(f"{str(year)[-2:]}-{str(year+1)[-2:]}: ${total:,.0f} [{fec_id_str}]\n")
                        print(f"{full_name} {year}-{year+1}: Total ${total:,.0f}")
                        for fec_id, amount in yearly_totals[year].items():
                            if amount > 0:
                                print(f"  {fec_id}: ${amount:,.0f}")
                    txt_file.write("\n")
                
            print(f"Generated: {output_file}")
    
    except FileNotFoundError:
        print(f"Error: Could not find '{yaml_file_path}'.")
    except yaml.YAMLError as e:
        print(f"Error parsing YAML: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
