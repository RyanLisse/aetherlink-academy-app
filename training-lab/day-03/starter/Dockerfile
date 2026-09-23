# Participant transaction-alert container (Node reference service).
# Build from training-lab/day-03/starter:
#   docker build -t trainee-alert:$USER .
# MOCK_API_URL must reach the shared day-03 mock (or a sidecar).
FROM node:24-alpine
WORKDIR /app
COPY transaction-alert.mjs ./
ENV PORT=8080
ENV MOCK_API_URL=http://host.docker.internal:48139
EXPOSE 8080
CMD ["node", "transaction-alert.mjs", "serve"]
