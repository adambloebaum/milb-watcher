# Deploying milb-watcher to Fly.io

This guide will walk you through deploying the milb-watcher application to Fly.io, a platform for running full-stack apps close to your users.

## Prerequisites

1. Install the Fly CLI:
   - On macOS: `brew install flyctl`
   - On Windows: `iwr https://fly.io/install.ps1 -useb | iex`
   - On Linux: `curl -L https://fly.io/install.sh | sh`

2. Sign up for Fly.io and log in:
   ```
   flyctl auth signup
   ```
   or
   ```
   flyctl auth login
   ```

## Deployment Steps

### 1. Initialize Fly.io Configuration

This repository already contains a `fly.toml` file and a `Dockerfile`, so you can skip the initialization step.

### 2. Create a Volume for Logs

Create a persistent volume to store the log files:

```
flyctl volumes create milb_logs --size 1 --region mia
```

Note: Replace `mia` with your preferred region. You can see available regions with `flyctl platform regions`.

### 3. Deploy the Application

From the root of the project directory, run:

```
flyctl deploy
```

This will:
1. Build a Docker image using the provided Dockerfile
2. Push the image to Fly.io's registry
3. Deploy the application according to the configuration in fly.toml

### 4. Monitor Your Application

Once deployed, you can:

- View logs: `flyctl logs`
- Monitor the application: `flyctl status`
- Access the app's information: `flyctl info`

### 5. Accessing Logs

The application logs are stored in the persistent volume. To access them:

```
# SSH into your Fly.io instance
flyctl ssh console

# Navigate to the logs directory
cd /app/logs

# List logs
ls -la

# View a specific log file
cat console-log-2023-07-01.log
```

You can also download logs to your local machine:

```
flyctl ssh sftp get /app/logs/console-log-2023-07-01.log ./local-copy.log
```

## Configuration Updates

If you need to update your configuration (like player ID or team ID):

1. Update your `config.js` file locally
2. Deploy again with `flyctl deploy`

## Troubleshooting

- **App not starting**: Check logs with `flyctl logs`
- **Volume issues**: Ensure the volume was created and is mounted correctly
- **Network problems**: Check if the app has access to the MLB API

## Useful Commands

```
# View app status
flyctl status

# Restart the app
flyctl restart

# Scale to a different machine size if needed
flyctl scale vm shared-cpu-1x

# Create a new deployment
flyctl deploy

# Access the console
flyctl ssh console
```

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Managing Fly.io Volumes](https://fly.io/docs/volumes/)
- [Fly.io Regions](https://fly.io/docs/reference/regions/)
- [Fly.io Machine Sizes](https://fly.io/docs/machines/)

## Accessing Your App

Once deployed, your app will be available at:
- `https://your-app-name.fly.dev`

You can access the HTTP endpoints at:
- Health check: `https://your-app-name.fly.dev/health`
- Stats: `https://your-app-name.fly.dev/stats`

## Monitoring and Logs

View your app's logs:

```bash
flyctl logs
```

Monitor your app:

```bash
flyctl status
```

## Updating Your App

When you need to update your app, make your changes locally and then run:

```bash
flyctl deploy
```

## Troubleshooting

### App Not Starting

Check the logs for errors:

```bash
flyctl logs
```

### Networking Issues

Make sure the port configuration matches in both your code and the `fly.toml` file.

### Configuration Problems

Double-check your environment variables and secrets:

```bash
flyctl secrets list
```

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Node.js Guide](https://fly.io/docs/languages-and-frameworks/node/)
- [Managing Fly.io Secrets](https://fly.io/docs/secrets/) 