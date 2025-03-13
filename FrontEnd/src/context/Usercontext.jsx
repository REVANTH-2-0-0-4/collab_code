import { createContext, useState } from "react";
import PropTypes from "prop-types"; // Add this import

export const UserContext = createContext();


 const Context = ({ children }) => {
  // Destructure children from props
  const [user, setUser] = useState(null);

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
