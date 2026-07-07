# posinegative-prediction-api
# Positive/Negative Sentiment Prediction API Demo

This project is a simple Next.js frontend that communicates with a KServe-hosted ALBERT SST-2 sentiment classification model. The application sends text to the model's prediction endpoint and displays the returned prediction.

---

## Prerequisites

* Kubernetes cluster with KServe deployed
* ALBERT SST-2 predictor running
* `kubectl` configured for the cluster
* Node.js (v24 recommended)
* npm

---

# 1. Verify the Predictor Pod

List the running ALBERT SST-2 predictor pod:

```bash
kubectl get pods -n kubeflow-user-example-com | grep albert-sst2
```

Example output:

```text
albert-sst2-predictor-00001-deployment-667d78874b-r4d5h
```

**Purpose**

Confirms that the predictor pod is running before sending requests.

---

# 2. Test the Model Inside the Pod

Execute a prediction request directly inside the predictor container.

```bash
kubectl exec -n kubeflow-user-example-com \
  $(kubectl get pods -n kubeflow-user-example-com | grep albert-sst2-predictor | awk '{print $1}') \
  -c kserve-container -- \
  curl -s -X POST http://localhost:8080/v1/models/albert-sst2:predict \
  -H "Content-Type: application/json" \
  -d '{"instances": ["This movie was absolutely wonderful"]}'
```

Example response:

```json
{"predictions":[0]}
```

**Purpose**

Verifies that the model itself is functioning correctly before exposing it outside the cluster.

---

# 3. Port Forward the Predictor

Expose the predictor locally on port **8080**.

```bash
kubectl port-forward -n kubeflow-user-example-com \
pod/albert-sst2-predictor-00001-deployment-667d78874b-r4d5h \
8080:8080
```

You should see:

```text
Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
```

**Purpose**

Makes the KServe inference endpoint available locally at:

```
http://localhost:8080
```

Keep this terminal open while using the application.

---

# 4. Test the Port-Forwarded Endpoint

Open another terminal and run:

```bash
curl -X POST \
http://localhost:8080/v1/models/albert-sst2:predict \
-H "Content-Type: application/json" \
-d '{
  "instances": [
    "This movie was absolutely wonderful"
  ]
}'
```

Example response:

```json
{"predictions":[0]}
```

**Purpose**

Confirms that the local port-forward is working correctly.

---

# 5. Install Project Dependencies

Navigate to the project directory:

```bash
cd ~/am/posinegative-prediction-api
```

Install dependencies:

```bash
npm install
```

**Purpose**

Downloads all required Node.js packages for the frontend.

---

# 6. Start the Next.js Development Server

Run:

```bash
npm run dev
```

Example output:

```text
▲ Next.js 16.x

Local:   http://localhost:3000
Network: http://10.79.99.138:3000
```

**Purpose**

Starts the frontend application.

---

# 7. Open the Application

Navigate to:

```
http://localhost:3000
```

The frontend sends prediction requests through:

```
POST /api/predict
```

which proxies requests to:

```
http://localhost:8080/v1/models/albert-sst2:predict
```

---

# Request Format

```json
{
  "instances": [
    "This movie was absolutely wonderful"
  ]
}
```

---

# Example Response

```json
{
  "predictions": [
    0
  ]
}
```

---

# Workflow Summary

1. Verify the predictor pod is running.
2. Test the model from inside the pod using `kubectl exec`.
3. Port-forward the predictor to `localhost:8080`.
4. Verify the port-forward using `curl`.
5. Install project dependencies with `npm install`.
6. Start the Next.js application with `npm run dev`.
7. Open the frontend at `http://localhost:3000` and submit text for sentiment prediction.
