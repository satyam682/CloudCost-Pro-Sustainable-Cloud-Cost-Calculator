import argparse

# Simplified generic cloud pricing model (Cost per hour)
# In a real-world scenario, this would involve API calls to AWS Pricing API, Azure Retail Rates API, or Google Cloud Billing API
PRICING_DATA = {
    'aws': {
        't3.micro': 0.0104,
        't3.small': 0.0208,
        'm5.large': 0.096,
        'c5.xlarge': 0.17,
        'storage_per_gb_month': 0.08  # gp3 EBS
    },
    'gcp': {
        'e2-micro': 0.0084,
        'e2-small': 0.0167,
        'n2-standard-2': 0.097,
        'storage_per_gb_month': 0.04
    },
    'azure': {
        'B1s': 0.0104,
        'D2s_v3': 0.096,
        'storage_per_gb_month': 0.05
    }
}

def calculate_compute_cost(provider, instance_type, hours):
    """Calculates compute cost based on provider, instance type, and hours."""
    try:
        hourly_rate = PRICING_DATA[provider.lower()][instance_type]
        return hourly_rate * hours
    except KeyError:
        raise ValueError(f"Pricing data not found for Provider: {provider}, Instance Type: {instance_type}")

def calculate_storage_cost(provider, storage_gb, months=1):
    """Calculates storage cost based on provider and provisioned storage."""
    try:
        monthly_rate = PRICING_DATA[provider.lower()]['storage_per_gb_month']
        return monthly_rate * storage_gb * months
    except KeyError:
        raise ValueError(f"Storage pricing data not found for Provider: {provider}")


def main():
    parser = argparse.ArgumentParser(description="Cloud Cost Calculator")
    parser.add_argument('--provider', type=str, required=True, choices=['aws', 'gcp', 'azure'], help="Cloud Provider (aws, gcp, azure)")
    parser.add_argument('--instance-type', type=str, required=True, help="Compute Instance Type (e.g., t3.micro, e2-micro)")
    parser.add_argument('--hours', type=float, default=730, help="Number of hours the instance will run (default: 730 hours / 1 month)")
    parser.add_argument('--storage-gb', type=float, default=0, help="Attached storage in GB")
    
    args = parser.parse_args()

    try:
        compute_cost = calculate_compute_cost(args.provider, args.instance_type, args.hours)
        storage_cost = calculate_storage_cost(args.provider, args.storage_gb, months=(args.hours / 730))
        total_cost = compute_cost + storage_cost

        print(f"\n--- Cloud Cost Estimation ---")
        print(f"Provider:      {args.provider.upper()}")
        print(f"Instance:      {args.instance_type} ({args.hours} hours)")
        print(f"Storage:       {args.storage_gb} GB")
        print(f"-----------------------------")
        print(f"Compute Cost:  ${compute_cost:.2f}")
        print(f"Storage Cost:  ${storage_cost:.2f}")
        print(f"Total Cost:    ${total_cost:.2f}")
        print(f"-----------------------------\n")

    except ValueError as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
