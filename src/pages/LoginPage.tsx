
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/LoginService";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Track loading state
  const navigate = useNavigate();
  const handleLogin = async () => {
    setLoading(true); // Set loading state to true when login starts
    
    if (!email || !password) {
      toast.error("Email and password are required.");
      setLoading(false)
      return;
    }

    try {
      const { session } = await login(email, password);
      if (session){
        navigate('/');
      }

    } catch (err) {
      toast.error("User credentials provided were incorrect");
    } finally {
      setLoading(false); // Reset loading state after login attempt
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials below to login to account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleLogin} 
            disabled={loading} // Disable button when loading
          >
            {loading ? <Loader /> : "Sign in"} {/* Show spinner or text based on loading state */}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
