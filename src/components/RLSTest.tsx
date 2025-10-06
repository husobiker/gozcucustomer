import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../lib/supabase";

const RLSTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any[] = [];

    try {
      // Test 1: Users table
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("*")
        .limit(5);

      results.push({
        table: "users",
        success: !usersError,
        error: usersError?.message,
        count: users?.length || 0,
      });

      // Test 2: Projects table
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .limit(5);

      results.push({
        table: "projects",
        success: !projectsError,
        error: projectsError?.message,
        count: projects?.length || 0,
      });

      // Test 3: Personnel table
      const { data: personnel, error: personnelError } = await supabase
        .from("personnel")
        .select("*")
        .limit(5);

      results.push({
        table: "personnel",
        success: !personnelError,
        error: personnelError?.message,
        count: personnel?.length || 0,
      });

      // Test 4: Check RLS status
      const { data: rlsStatus, error: rlsError } = await supabase.rpc(
        "check_rls_status"
      );

      results.push({
        table: "rls_status",
        success: !rlsError,
        error: rlsError?.message,
        data: rlsStatus,
      });
    } catch (error) {
      results.push({
        table: "general",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        RLS Test
      </Typography>

      <Button
        variant="contained"
        onClick={runTests}
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={20} /> : "Test Et"}
      </Button>

      {testResults.map((result, index) => (
        <Alert
          key={index}
          severity={result.success ? "success" : "error"}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">{result.table}</Typography>
          <Typography variant="body2">
            Success: {result.success ? "Yes" : "No"}
          </Typography>
          {result.error && (
            <Typography variant="body2" color="error">
              Error: {result.error}
            </Typography>
          )}
          {result.count !== undefined && (
            <Typography variant="body2">Count: {result.count}</Typography>
          )}
          {result.data && (
            <Typography variant="body2">
              Data: {JSON.stringify(result.data)}
            </Typography>
          )}
        </Alert>
      ))}
    </Box>
  );
};

export default RLSTest;
