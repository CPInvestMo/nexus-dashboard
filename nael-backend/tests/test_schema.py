"""Safe local test of NAEL D1 migration using standard-library SQLite.
This verifies SQL syntax, persistence, FK/CHECK and unique-key semantics.
It does NOT verify deployed Cloudflare D1 or production uptime.
"""
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path

SCHEMA = (Path(__file__).resolve().parents[1] / "migrations" / "0001_core_d1.sql").read_text(encoding="utf-8")

class TestSchema(unittest.TestCase):
    def setUp(self):
        fd, self.path = tempfile.mkstemp(prefix="nael-test-", suffix=".sqlite")
        os.close(fd)
        self.db = sqlite3.connect(self.path)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript(SCHEMA)

    def tearDown(self):
        self.db.close()
        os.remove(self.path)

    def test_tables_and_repeatable_migration(self):
        self.db.executescript(SCHEMA)
        expected = {
            "users","projects","agents","tasks","automation_schedules",
            "execution_runs","approvals","integration_connections",
            "opportunities","financial_records","audit_logs","documents",
        }
        actual = {r[0] for r in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertTrue(expected.issubset(actual))

    def test_fk_enums_and_restart_persistence(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO tasks(id,project_id,title) VALUES('bad','missing','No project')")
        self.db.execute("INSERT INTO projects(id,slug,name) VALUES('p1','other','Test only')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO tasks(id,project_id,title,task_state) VALUES('t-invalid','p1','Invalid','MADE_UP')")
        self.db.execute("INSERT INTO tasks(id,project_id,title) VALUES('t1','p1','Internal database self-check')")
        self.db.execute("INSERT INTO execution_runs(execution_id,target_type,target_id,idempotency_key,execution_state) VALUES('e1','TASK','t1','test-key-12345','SUCCEEDED')")
        self.db.execute("INSERT INTO audit_logs(id,actor,action_name,entity_type,entity_id,execution_id,outcome) VALUES('a1','qa','DB_SELF_CHECK','TASK','t1','e1','SUCCEEDED')")
        self.db.commit()
        self.db.close()
        self.db = sqlite3.connect(self.path)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.assertEqual(self.db.execute("SELECT execution_state FROM execution_runs WHERE execution_id='e1'").fetchone()[0],"SUCCEEDED")
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM audit_logs WHERE execution_id='e1'").fetchone()[0],1)

    def test_idempotency_and_approval_enums(self):
        self.db.execute("INSERT INTO execution_runs(execution_id,target_type,target_id,idempotency_key) VALUES('e1','SYNC','all','same-identity')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO execution_runs(execution_id,target_type,target_id,idempotency_key) VALUES('e2','SYNC','all','same-identity')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO approvals(id,action_type,target_entity,payload_json,scope,status,idempotency_key) VALUES('a1','OUTBOUND_MSG','x','{}','x','SENT','approval-key')")

    def test_cannot_mark_integration_operational_without_flags(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO integration_connections(id,service_name,is_operational) VALUES('i1','Gmail',1)")

if __name__ == "__main__":
    unittest.main(verbosity=2)
