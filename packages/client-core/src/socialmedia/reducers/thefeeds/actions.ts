/**
 * @author Gleb Ordinsky <glebordinskijj@gmail.com>
 */

import { TheFeedsShort, TheFeeds } from '@xr3ngine/common/src/interfaces/Feeds';


// const thefeeds = '';
// conts TheFeeds = '';
// const THEFEEDS = '';

export const THEFEEDS_RETRIEVED = 'THEFEEDS_RETRIEVED';
export const THEFEEDS_FETCH = 'THEFEEDS_FETCH';
export const ADD_THEFEEDS = 'ADD_THEFEEDS';
export const REMOVE_THEFEEDS = 'REMOVE_THEFEEDS';
export const UPDATE_THEFEEDS = 'UPDATE_THEFEEDS';


export interface AllTheFeedsRetrievedAction {
  type: string;
  thefeeds: TheFeedsShort[];
}

export interface TheFeedsRetrievedAction {
  type: string;
  thefeeds: TheFeeds;
}

export interface FetchingTheFeedsAction {
  type: string;
}

export interface oneTheFeedsAction {
  type: string;
  thefeeds: string;
}

export type TheFeedsAction =
  TheFeedsRetrievedAction
  | TheFeedsRetrievedAction
  | FetchingTheFeedsAction
  | oneTheFeedsAction

export function thefeedsRetrieved (thefeeds: TheFeeds[]): AllTheFeedsRetrievedAction {
  // console.log('actions',thefeeds)
  return {
    type: THEFEEDS_RETRIEVED,
    thefeeds: thefeeds
  };
}


export function fetchingTheFeeds (): FetchingTheFeedsAction {
  return {
    type: THEFEEDS_FETCH
  };
}

export function deleteTheFeeds(thefeedsId:string) : oneTheFeedsAction{
  return {
    type: REMOVE_THEFEEDS,
    thefeeds: thefeedsId
  };
}


export function addTheFeeds(thefeeds:TheFeeds): TheFeedsRetrievedAction{
  return {
    type: ADD_THEFEEDS,
    thefeeds: thefeeds
  };
}


export function updateTheFeedsInList(thefeeds: TheFeeds): TheFeedsRetrievedAction{
  return {
    type: UPDATE_THEFEEDS,
    thefeeds: thefeeds,
  };
}