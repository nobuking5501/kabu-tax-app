-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  years INTEGER[] NOT NULL,
  transaction_count INTEGER NOT NULL,
  pdf_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity VARCHAR(20) NOT NULL CHECK (activity IN ('Purchased', 'Sold')),
  quantity NUMERIC(20, 8) NOT NULL,
  price NUMERIC(20, 8) NOT NULL,
  commission NUMERIC(20, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_submission_id ON transactions(submission_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
