import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
app = Flask(__name__, static_folder=frontend_dir, static_url_path='/')
CORS(app)  # Allow frontend to communicate with backend

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

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/calculate', methods=['POST'])
def calculate_cost():
    data = request.json
    provider = data.get('provider', '').lower()
    instance_type = data.get('instance_type', '')
    hours = float(data.get('hours', 730))
    storage_gb = float(data.get('storage_gb', 0))

    try:
        if provider not in PRICING_DATA:
            return jsonify({'error': 'Invalid provider'}), 400
        if instance_type not in PRICING_DATA[provider]:
            return jsonify({'error': 'Invalid instance type for provider'}), 400

        # Compute Cost Calculation
        compute_cost = PRICING_DATA[provider][instance_type] * hours
        
        # Storage Cost Calculation
        storage_monthly_rate = PRICING_DATA[provider]['storage_per_gb_month']
        storage_cost = storage_monthly_rate * storage_gb * (hours / 730)
        
        total_cost = compute_cost + storage_cost

        return jsonify({
            'compute_cost': round(compute_cost, 2),
            'storage_cost': round(storage_cost, 2),
            'total_cost': round(total_cost, 2)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pricing-data', methods=['GET'])
def get_pricing_data():
    return jsonify(PRICING_DATA)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
