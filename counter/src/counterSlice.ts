import {
  Action,
  configureStore,
  createAsyncThunk,
  createSlice,
  PayloadAction,
  ThunkAction,
  ThunkDispatch,
} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { fetchCount } from "./counterAPI";
import "immer";
import "redux-thunk";

export interface CounterState {
  value: number;
  status: "idle" | "loading" | "failed";
}

const initialState: CounterState = {
  value: 0,
  status: "idle",
};

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched. Thunks are
// typically used to make async requests.
export const incrementAsync = createAsyncThunk(
  "counter/fetchCount",
  async (amount: number) => {
    const response = await fetchCount(amount);
    // The value we return becomes the `fulfilled` action payload
    return response.data;
  }
);

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
  // The `extraReducers` field lets the slice handle actions defined elsewhere,
  // including actions generated by createAsyncThunk or in other slices.
  extraReducers: (builder) => {
    builder
      .addCase(incrementAsync.pending, (state) => {
        state.status = "loading";
      })
      .addCase(incrementAsync.fulfilled, (state, action) => {
        state.status = "idle";
        state.value += action.payload;
      });
  },
});

// RootStateInterface is defined as including at least this slice and any other slices that
// might be added by a calling package
type RootStateInterface = { counter: CounterState } & Record<string, any>;

// A version of AppThunk that uses the RootStateInterface just defined
type AppThunkInterface<ReturnType = void> = ThunkAction<
  ReturnType,
  RootStateInterface,
  unknown,
  Action<string>
>;

// A version of use selector that includes the RootStateInterface we just defined
export let useSliceSelector: TypedUseSelectorHook<RootStateInterface> =
  useSelector;

// This function would configure a "local" store if called, but currently it is
// not called, and is just used for type inference.
const configureLocalStore = () =>
  configureStore({
    reducer: { counter: counterSlice.reducer },
  });

// Infer the type of the dispatch that would be needed for a store that consisted of
// just this slice
type SliceDispatch = ReturnType<typeof configureLocalStore>["dispatch"];

// AppDispatchInterface is defined as including at least this slices "local" dispatch and
// the dispatch of any slices that might be added by the calling package.
type AppDispatchInterface = SliceDispatch & ThunkDispatch<any, any, any>;

export let useSliceDispatch = () => useDispatch<AppDispatchInterface>();

// Allows initializing of this package by a calling package with the "global"
// dispatch and selector hooks of that package, provided they satisfy this packages
// state and dispatch interfaces--which they will if the imported this package and
// used it to compose their store.
export const initializeSlicePackage = (
  useAppDispatch: typeof useSliceDispatch,
  useAppSelector: typeof useSliceSelector
) => {
  useSliceDispatch = useAppDispatch;
  useSliceSelector = useAppSelector;
};

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectCount = (state: RootStateInterface) => state.counter.value;

// We can also write thunks by hand, which may contain both sync and async logic.
// Here's an example of conditionally dispatching actions based on current state.
export const incrementIfOdd =
  (amount: number): AppThunkInterface =>
  (dispatch, getState) => {
    const currentValue = selectCount(getState());
    if (currentValue % 2 === 1) {
      dispatch(incrementByAmount(amount));
    }
  };

export const counterSliceReducer = counterSlice.reducer;
