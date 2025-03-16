import { createContext, useState } from "react";
import PropTypes from "prop-types"; // Add this import

export const UserContext = createContext();


 const Context = ({ children }) => {
  // Destructure children from props
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To prevent flickering

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // Attach token to axios headers (optional)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch user details from the backend
      axios
        .get("/auth/me") // Replace with your endpoint to get user info
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
          localStorage.removeItem("token"); // Remove invalid token
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
Context.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Context;
