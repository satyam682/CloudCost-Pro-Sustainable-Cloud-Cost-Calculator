.PHONY: aws_example gcp_example azure_example help

# Default target
all: help

# Run an example AWS cost calculation
aws_example:
	python cloud_cost_calculator.py --provider aws --instance-type t3.micro --hours 730 --storage-gb 20

# Run an example GCP cost calculation
gcp_example:
	python cloud_cost_calculator.py --provider gcp --instance-type e2-micro --hours 100 --storage-gb 10

# Run an example Azure cost calculation
azure_example:
	python cloud_cost_calculator.py --provider azure --instance-type B1s --hours 500 --storage-gb 50

# Help message
help:
	@echo "Cloud Cost Calculator Makefile"
	@echo ""
	@echo "Available commands:"
	@echo "  make aws_example    - Run an example AWS cost calculation (t3.micro with 20GB storage)"
	@echo "  make gcp_example    - Run an example GCP cost calculation (e2-micro with 10GB storage)"
	@echo "  make azure_example  - Run an example Azure cost calculation (B1s with 50GB storage)"
	@echo ""
	@echo "To run manually:"
	@echo "  python cloud_cost_calculator.py --provider aws --instance-type t3.micro --hours 730 --storage-gb 20"
