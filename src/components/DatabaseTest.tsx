import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
} from "@mui/material";
import {
  Storage as DatabaseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  setupDatabase,
  testDatabaseConnection,
  createAdminUser,
} from "../utils/setupDatabase";

interface TestResults {
  connection?: any;
  setup?: any;
  admin?: any;
}

const DatabaseTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [error, setError] = useState("");

  const handleTestConnection = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await testDatabaseConnection();
      setResults({ connection: result });
    } catch (err) {
      setError("Connection test failed");
    }

    setLoading(false);
  };

  const handleSetupDatabase = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await setupDatabase();
      setResults((prev: TestResults | null) => ({ ...prev, setup: result }));
    } catch (err) {
      setError("Database setup failed");
    }

    setLoading(false);
  };

  const handleCreateAdmin = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await createAdminUser("admin@safebase.com", "admin123");
      setResults((prev: TestResults | null) => ({ ...prev, admin: result }));
    } catch (err) {
      setError("Admin creation failed");
    }

    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Database Test & Setup
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DatabaseIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Connection Test</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Test database connection and basic queries
              </Typography>
              <Button
                variant="contained"
                onClick={handleTestConnection}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : "Test Connection"}
              </Button>
              {results?.connection && (
                <Box mt={2}>
                  <Chip
                    icon={
                      results.connection.success ? (
                        <CheckCircleIcon />
                      ) : (
                        <ErrorIcon />
                      )
                    }
                    label={results.connection.success ? "Connected" : "Failed"}
                    color={results.connection.success ? "success" : "error"}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DatabaseIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Setup Database</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Initialize database tables and settings
              </Typography>
              <Button
                variant="contained"
                onClick={handleSetupDatabase}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : "Setup Database"}
              </Button>
              {results?.setup && (
                <Box mt={2}>
                  <Chip
                    icon={
                      results.setup.success ? (
                        <CheckCircleIcon />
                      ) : (
                        <ErrorIcon />
                      )
                    }
                    label={
                      results.setup.success ? "Setup Complete" : "Setup Failed"
                    }
                    color={results.setup.success ? "success" : "error"}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DatabaseIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Create Admin</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create default admin user
              </Typography>
              <Button
                variant="contained"
                onClick={handleCreateAdmin}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : "Create Admin"}
              </Button>
              {results?.admin && (
                <Box mt={2}>
                  <Chip
                    icon={
                      results.admin.success ? (
                        <CheckCircleIcon />
                      ) : (
                        <ErrorIcon />
                      )
                    }
                    label={
                      results.admin.success
                        ? "Admin Created"
                        : "Creation Failed"
                    }
                    color={results.admin.success ? "success" : "error"}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {results && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            <pre
              style={{
                backgroundColor: "#f5f5f5",
                padding: "16px",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "12px",
              }}
            >
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DatabaseTest;
