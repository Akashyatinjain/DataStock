import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createCheckoutSession,
  getSubscriptionStatus,
  syncPaymentReturn,
} from '../../api/payment.api';
import { normalizePlan } from '../../utils/subscription';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export const startCheckout = createAsyncThunk('payment/startCheckout', async (plan, thunkAPI) => {
  try {
    return await createCheckoutSession(plan);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to start checkout'));
  }
});

export const fetchSubscriptionStatus = createAsyncThunk(
  'payment/fetchSubscriptionStatus',
  async (_, thunkAPI) => {
    try {
      return await getSubscriptionStatus();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, 'Could not load subscription status. Please refresh.')
      );
    }
  }
);

export const syncPaymentReturnStatus = createAsyncThunk(
  'payment/syncPaymentReturnStatus',
  async (payload, thunkAPI) => {
    try {
      return await syncPaymentReturn(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, 'Payment return sync failed'));
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    subscription: null,
    currentPlan: 'BASIC',
    loading: false,
    checkoutLoading: false,
    checkoutPlan: null,
    syncing: false,
    error: null,
  },
  reducers: {
    applySubscription: (state, action) => {
      const subscription = action.payload || null;
      const plan = normalizePlan(subscription?.plan || 'BASIC');
      state.currentPlan = plan;
      state.subscription = subscription ? { ...subscription, plan } : null;
      state.error = null;
    },
    resetSubscription: (state) => {
      state.subscription = null;
      state.currentPlan = 'BASIC';
      state.loading = false;
      state.error = null;
    },
    clearPaymentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startCheckout.pending, (state, action) => {
        state.checkoutLoading = true;
        state.checkoutPlan = action.meta.arg;
        state.error = null;
      })
      .addCase(startCheckout.fulfilled, (state) => {
        state.checkoutLoading = false;
        state.checkoutPlan = null;
      })
      .addCase(startCheckout.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutPlan = null;
        state.error = action.payload;
      })
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const subscription = action.payload.subscription || null;
          const plan = normalizePlan(subscription?.plan || 'BASIC');
          state.subscription = subscription ? { ...subscription, plan } : null;
          state.currentPlan = plan;
        } else {
          state.error = action.payload.message || 'Could not load subscription status.';
        }
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(syncPaymentReturnStatus.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(syncPaymentReturnStatus.fulfilled, (state, action) => {
        state.syncing = false;
        if (action.payload.success) {
          const subscription = action.payload.subscription || null;
          const plan = normalizePlan(subscription?.plan || 'BASIC');
          state.subscription = subscription ? { ...subscription, plan } : null;
          state.currentPlan = plan;
        }
      })
      .addCase(syncPaymentReturnStatus.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      });
  },
});

export const { applySubscription, resetSubscription, clearPaymentError } = paymentSlice.actions;
export default paymentSlice.reducer;
