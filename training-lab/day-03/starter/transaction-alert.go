// Transaction alert starter (AET-38).
// Pipeline: input → AI stub → business logic → alert draft (human gate).
// Fictional Reconciliation only — no live PSP.
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

const reviewThresholdEUR = 9000

type Transaction struct {
	ID               string  `json:"id"`
	AmountEUR        float64 `json:"amountEur"`
	Region           string  `json:"region"`
	Merchant         string  `json:"merchant"`
	Channel          string  `json:"channel"`
	OccurredAt       string  `json:"occurredAt"`
	SeededDeviation  bool    `json:"seededDeviation"`
}

type AiAnalysis struct {
	Score   float64 `json:"score"`
	Summary string  `json:"summary"`
	Model   string  `json:"model"`
}

type AlertDraft struct {
	TransactionID          string     `json:"transactionId"`
	Alert                  bool       `json:"alert"`
	Severity               string     `json:"severity"`
	Reason                 string     `json:"reason"`
	AI                     AiAnalysis `json:"ai"`
	DraftOnly              bool       `json:"draft_only"`
	HumanApprovalRequired  bool       `json:"human_approval_required"`
	Pipeline               string     `json:"pipeline"`
	Framing                string     `json:"framing"`
}

type listResponse struct {
	Transactions []Transaction `json:"transactions"`
}

func analyzeWithAi(tx Transaction) AiAnalysis {
	channelBoost := 0.0
	if tx.Channel == "ecom" {
		channelBoost = 0.15
	}
	seededBoost := 0.0
	if tx.SeededDeviation {
		seededBoost = 0.4
	}
	amountScore := tx.AmountEUR / (reviewThresholdEUR * 1.5)
	if amountScore > 1 {
		amountScore = 1
	}
	score := amountScore*0.6 + channelBoost + seededBoost
	if score > 1 {
		score = 1
	}
	score = float64(int(score*1000+0.5)) / 1000
	summary := "AI stub sees amount within fictional cohort"
	if score >= 0.7 {
		summary = "AI stub flags elevated anomaly vs fictional cohort"
	}
	return AiAnalysis{Score: score, Summary: summary, Model: "fictional-ai-stub-v0"}
}

func alertForTransaction(tx Transaction) AlertDraft {
	ai := analyzeWithAi(tx)
	amountExceeded := tx.AmountEUR >= reviewThresholdEUR
	aiElevated := ai.Score >= 0.7
	alert := amountExceeded || aiElevated
	severity := "low"
	reason := "within the fictional review threshold"
	if amountExceeded {
		severity = "high"
		reason = "amount exceeds the fictional review threshold"
	} else if aiElevated {
		severity = "medium"
		reason = "AI score elevated above fictional cohort"
	}
	return AlertDraft{
		TransactionID:         tx.ID,
		Alert:                 alert,
		Severity:              severity,
		Reason:                reason,
		AI:                    ai,
		DraftOnly:             true,
		HumanApprovalRequired: true,
		Pipeline:              "input → AI → business logic → alert draft",
		Framing:               "Fictional Reconciliation",
	}
}

func runAgainstMock(baseURL, targetID string) (AlertDraft, error) {
	resp, err := http.Get(baseURL + "/transactions")
	if err != nil {
		return AlertDraft{}, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return AlertDraft{}, err
	}
	if resp.StatusCode != 200 {
		return AlertDraft{}, fmt.Errorf("mock API %d", resp.StatusCode)
	}
	var list listResponse
	if err := json.Unmarshal(body, &list); err != nil {
		return AlertDraft{}, err
	}
	for _, row := range list.Transactions {
		if row.ID == targetID {
			return alertForTransaction(row), nil
		}
	}
	return AlertDraft{}, fmt.Errorf("seeded transaction %s missing from mock", targetID)
}

func main() {
	base := os.Getenv("MOCK_API_URL")
	if base == "" {
		base = "http://127.0.0.1:48139"
	}
	mode := "draft"
	if len(os.Args) > 1 {
		mode = os.Args[1]
	}
	if mode == "serve" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("content-type", "application/json")
			_, _ = w.Write([]byte(`{"ok":true,"service":"transaction-alert","draft_only":true}`))
		})
		http.HandleFunc("/alert", func(w http.ResponseWriter, r *http.Request) {
			id := r.URL.Query().Get("id")
			if id == "" {
				id = "TX-FIC-302"
			}
			draft, err := runAgainstMock(base, id)
			w.Header().Set("content-type", "application/json")
			if err != nil {
				w.WriteHeader(502)
				_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
				return
			}
			enc := json.NewEncoder(w)
			enc.SetIndent("", "  ")
			_ = enc.Encode(draft)
		})
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != "/" {
				http.NotFound(w, r)
				return
			}
			http.Redirect(w, r, "/alert?id=TX-FIC-302", http.StatusFound)
		})
		fmt.Fprintf(os.Stderr, "{\"service\":\"transaction-alert\",\"port\":%q,\"mockApi\":%q}\n", port, base)
		if err := http.ListenAndServe(":"+port, nil); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}
	draft, err := runAgainstMock(base, "TX-FIC-302")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	_ = enc.Encode(draft)
}
