const initialState = {
  loader: false,
  user: null,
};

// Action creators
export const setUserData = (user) => ({
  type: "auth/setUserData",
  payload: user,
});

export const removeUserData = () => ({
  type: "auth/removeUserData",
});

export const setLoader = (isLoading) => ({
  type: "auth/setLoader",
  payload: isLoading,
});

// Reducer
export const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case "auth/setUserData":
      return { ...state, user: action.payload, loader: false };
    case "auth/removeUserData":
      return { ...state, user: null, loader: false };
    case "auth/setLoader":
      return { ...state, loader: action.payload };
    default:
      return state;
  }
};
