-- サンプルデータ挿入用SQL
-- Supabaseの SQL Editor で実行してください

-- サンプル顧客データ（submissions）
INSERT INTO submissions (email, symbol, currency, years, transaction_count, pdf_generated, created_at) VALUES
  ('yamada@example.com', 'AAPL', 'USD', ARRAY[2024], 5, true, '2024-01-15 10:30:00'),
  ('yamada@example.com', 'GOOGL', 'USD', ARRAY[2024], 3, true, '2024-02-20 14:45:00'),
  ('yamada@example.com', 'TSLA', 'USD', ARRAY[2024, 2025], 8, true, '2024-03-10 09:15:00'),
  ('suzuki@example.com', 'MSFT', 'USD', ARRAY[2024], 4, true, '2024-01-25 11:20:00'),
  ('suzuki@example.com', 'NVDA', 'USD', ARRAY[2024], 6, true, '2024-04-05 16:00:00'),
  ('tanaka@example.com', 'AMZN', 'USD', ARRAY[2024], 2, true, '2024-02-14 13:30:00'),
  ('sato@example.com', 'META', 'USD', ARRAY[2024], 7, true, '2024-03-22 10:00:00'),
  ('sato@example.com', 'AAPL', 'USD', ARRAY[2024, 2025], 10, true, '2024-05-18 15:45:00');

-- サンプル取引データ（transactions）
-- submission_id = 1 (yamada@example.com - AAPL)
INSERT INTO transactions (submission_id, date, activity, quantity, price, commission) VALUES
  (1, '2024-01-10', 'Purchased', 50, 150.00, 5.00),
  (1, '2024-03-15', 'Purchased', 30, 160.00, 3.00),
  (1, '2024-06-20', 'Sold', -40, 180.00, 4.00),
  (1, '2024-09-10', 'Purchased', 25, 175.00, 2.50),
  (1, '2024-11-05', 'Sold', -20, 190.00, 2.00);

-- submission_id = 2 (yamada@example.com - GOOGL)
INSERT INTO transactions (submission_id, date, activity, quantity, price, commission) VALUES
  (2, '2024-02-01', 'Purchased', 100, 120.00, 10.00),
  (2, '2024-05-15', 'Sold', -50, 135.00, 5.00),
  (2, '2024-08-20', 'Purchased', 40, 130.00, 4.00);

-- submission_id = 3 (yamada@example.com - TSLA)
INSERT INTO transactions (submission_id, date, activity, quantity, price, commission) VALUES
  (3, '2024-01-05', 'Purchased', 80, 200.00, 8.00),
  (3, '2024-02-10', 'Purchased', 50, 210.00, 5.00),
  (3, '2024-04-15', 'Sold', -60, 230.00, 6.00),
  (3, '2024-06-20', 'Purchased', 40, 220.00, 4.00),
  (3, '2024-08-25', 'Sold', -30, 240.00, 3.00),
  (3, '2024-10-30', 'Purchased', 70, 235.00, 7.00),
  (3, '2025-01-15', 'Sold', -50, 250.00, 5.00),
  (3, '2025-03-20', 'Purchased', 60, 245.00, 6.00);

-- submission_id = 4 (suzuki@example.com - MSFT)
INSERT INTO transactions (submission_id, date, activity, quantity, price, commission) VALUES
  (4, '2024-01-20', 'Purchased', 40, 350.00, 4.00),
  (4, '2024-04-10', 'Purchased', 30, 360.00, 3.00),
  (4, '2024-07-15', 'Sold', -35, 380.00, 3.50),
  (4, '2024-10-20', 'Purchased', 45, 375.00, 4.50);

-- submission_id = 5 (suzuki@example.com - NVDA)
INSERT INTO transactions (submission_id, date, activity, quantity, price, commission) VALUES
  (5, '2024-02-15', 'Purchased', 20, 500.00, 2.00),
  (5, '2024-05-20', 'Purchased', 15, 550.00, 1.50),
  (5, '2024-08-25', 'Sold', -18, 600.00, 1.80),
  (5, '2024-11-10', 'Purchased', 25, 580.00, 2.50),
  (5, '2024-12-15', 'Sold', -12, 620.00, 1.20),
  (5, '2025-02-20', 'Purchased', 30, 610.00, 3.00);

-- submission_id = 6 (tanaka@example.com - AMZN)
INSERT INTO transactions (submission_id, date, activity, quantity, price, commission) VALUES
  (6, '2024-02-10', 'Purchased', 60, 140.00, 6.00),
  (6, '2024-07-15', 'Sold', -60, 155.00, 6.00);

-- submission_id = 7 (sato@example.com - META)
INSERT INTO transactions (submission_id, date, activity, quantity, price, commission) VALUES
  (7, '2024-03-01', 'Purchased', 35, 400.00, 3.50),
  (7, '2024-05-10', 'Purchased', 25, 420.00, 2.50),
  (7, '2024-07-15', 'Sold', -30, 450.00, 3.00),
  (7, '2024-09-20', 'Purchased', 40, 440.00, 4.00),
  (7, '2024-11-25', 'Sold', -25, 470.00, 2.50),
  (7, '2025-01-30', 'Purchased', 50, 460.00, 5.00),
  (7, '2025-03-15', 'Sold', -35, 480.00, 3.50);

-- submission_id = 8 (sato@example.com - AAPL)
INSERT INTO transactions (submission_id, date, activity, quantity, price, commission) VALUES
  (8, '2024-01-15', 'Purchased', 100, 145.00, 10.00),
  (8, '2024-03-20', 'Purchased', 80, 155.00, 8.00),
  (8, '2024-05-25', 'Sold', -90, 170.00, 9.00),
  (8, '2024-07-30', 'Purchased', 70, 165.00, 7.00),
  (8, '2024-09-15', 'Purchased', 60, 175.00, 6.00),
  (8, '2024-11-20', 'Sold', -80, 185.00, 8.00),
  (8, '2025-01-25', 'Purchased', 90, 180.00, 9.00),
  (8, '2025-03-10', 'Purchased', 50, 188.00, 5.00),
  (8, '2025-05-15', 'Sold', -70, 195.00, 7.00),
  (8, '2025-07-20', 'Purchased', 100, 190.00, 10.00);
