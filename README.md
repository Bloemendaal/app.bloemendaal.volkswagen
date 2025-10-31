# Homey Volkswagen App

Adds support for Volkswagen cars in Europe to your Homey smart home system.

## Features

- Connect your Volkswagen car to Homey
- View real-time vehicle data (range, charging status, door/window status, etc.)
- Control supported features (e.g., set target charge level)
- Automate actions based on your car's state
- Secure authentication with Volkswagen ID and S-PIN

## Supported Vehicles

This app is designed for Volkswagen vehicles with We Connect or We Connect ID. Please check compatibility with your specific model.

## Getting Started

1. **Install the app** on your Homey.
2. **Add your Volkswagen** via the Homey app:
	 - Enter your Volkswagen ID (email and password)
	 - Enter your S-PIN (required for some actions)
	 - Select your vehicle
3. **Configure polling interval** and other settings as desired.

## Capabilities

The app provides the following Homey capabilities (may vary by vehicle):

- Door/window open status
- Unsafe situation alarm
- Charging power and rate
- Range and remaining charging time
- Target charge level (settable)
- Last updated timestamp

## Configuration

You can adjust settings such as polling interval (default: 10 minutes) to balance data freshness and battery usage.

## Credits

**A special thanks to [tillsteinbach/CarConnectivity](https://github.com/tillsteinbach/CarConnectivity)** for the original Python codebase, which was transformed and adapted to TypeScript for this project.

## Disclaimer

This project is **not** affiliated with, endorsed by, or associated with Volkswagen AG or any of its subsidiaries. "Volkswagen" and related marks are trademarks of Volkswagen AG. This app is provided as-is, without any warranty. Use at your own risk.
