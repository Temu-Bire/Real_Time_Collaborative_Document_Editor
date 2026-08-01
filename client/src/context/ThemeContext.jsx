import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme_preference") || "dark";
  });

  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {

    const root = document.documentElement;

    const applyTheme = (mode) => {

      root.classList.remove("dark", "night");

      if (mode === "night") {

        root.classList.add("night");
        setResolvedTheme("night");

      } else {

        root.classList.add("dark");
        setResolvedTheme("dark");
      }
    };

    applyTheme(theme);

  }, [theme]);

  // Cycle: dark -> night -> dark

  const toggleTheme = () => {

    const nextTheme =
      theme === "dark"
        ? "night"
        : "dark";
    setTheme(nextTheme);

    localStorage.setItem(
      "theme_preference",
      nextTheme
    );
  };

  const changeTheme = (newTheme) => {

    if(newTheme !== "dark" && newTheme !== "night"){
      return;
    }


    setTheme(newTheme);

    localStorage.setItem(
      "theme_preference",
      newTheme
    );
  };

  return (

    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        toggleTheme,
        changeTheme
      }}
    >
      {children}

    </ThemeContext.Provider>
  );
};

export const useTheme = () => {

  const context = useContext(ThemeContext);

  if(!context){

    throw new Error(
      "useTheme must be used within ThemeProvider"
    );
  }
  return context;
};