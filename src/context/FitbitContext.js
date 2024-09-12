import { createContext, useContext, useState, useEffect } from 'react';
import { auth, firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const FitbitContext = createContext();

export const useFitbit = () => useContext(FitbitContext);

export const FitbitProvider = ({ children }) => {
  const [fitbitToken, setFitbitToken] = useState(null);

  useEffect(() => {
    const fetchFitbitToken = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
            console.log("found user - getting token");
          const token = userDoc.data().fitbitToken;
          setFitbitToken(token);
        }
      }
    };

    fetchFitbitToken();
  }, []);

  return (
    <FitbitContext.Provider value={{ fitbitToken, setFitbitToken }}>
      {children}
    </FitbitContext.Provider>
  );
};
