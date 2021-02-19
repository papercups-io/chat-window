import request from 'superagent';
import {DEFAULT_BASE_URL} from './config';
import {now} from './utils';
import {CustomerMetadata} from './types';

const EMPTY_METADATA = {} as CustomerMetadata;

export const createNewCustomer = async (
  accountId: string,
  metadata: CustomerMetadata = EMPTY_METADATA,
  baseUrl = DEFAULT_BASE_URL
) => {
  return request
    .post(`${baseUrl}/api/customers`)
    .send({
      customer: {
        ...metadata,
        account_id: accountId,
        // TODO: handle on the server instead?
        first_seen: now(),
        last_seen: now(),
      },
    })
    .then((res) => res.body.data);
};

export const isValidCustomer = async (
  customerId: string,
  accountId: string,
  baseUrl = DEFAULT_BASE_URL
) => {
  return request
    .get(`${baseUrl}/api/customers/${customerId}/exists`)
    .query({
      account_id: accountId,
    })
    .then((res) => res.body.data);
};

export const updateCustomerMetadata = async (
  customerId: string,
  metadata: CustomerMetadata = EMPTY_METADATA,
  baseUrl = DEFAULT_BASE_URL
) => {
  return request
    .put(`${baseUrl}/api/customers/${customerId}/metadata`)
    .send({
      metadata,
    })
    .then((res) => res.body.data);
};

export const createNewConversation = async (
  accountId: string,
  customerId: string,
  baseUrl = DEFAULT_BASE_URL
) => {
  return request
    .post(`${baseUrl}/api/conversations`)
    .send({
      conversation: {
        account_id: accountId,
        customer_id: customerId,
      },
    })
    .then((res) => res.body.data);
};

export const findCustomerByExternalId = async (
  externalId: string,
  accountId: string,
  filters: Record<string, any>,
  baseUrl = DEFAULT_BASE_URL
) => {
  return request
    .get(`${baseUrl}/api/customers/identify`)
    .query({...filters, external_id: externalId, account_id: accountId})
    .then((res) => res.body.data);
};

export const fetchCustomerConversations = async (
  customerId: string,
  accountId: string,
  baseUrl = DEFAULT_BASE_URL
) => {
  return request
    .get(`${baseUrl}/api/conversations/customer`)
    .query({customer_id: customerId, account_id: accountId})
    .then((res) => res.body.data);
};

export const upload = async (
  accountId: string,
  file: any,
  baseUrl = DEFAULT_BASE_URL
) => {
  return request
    .post(`${baseUrl}/api/upload`)
    .send({
      file,
      account_id: accountId,
    })
    .then((res) => res.body.data);
};
