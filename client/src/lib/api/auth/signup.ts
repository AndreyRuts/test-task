import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface SignUpPayload {
  email: string;
  password: string;
}

export const signUpUser = async (data: SignUpPayload) => {
  const res = await axios.post(`${API_BASE}/auth/register`, data);
  return res.data;
};
