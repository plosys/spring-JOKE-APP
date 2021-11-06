import { noop } from '@appsemble/utils';
import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MessageDescriptor, useIntl } from 'react-intl';
import { Routes, useLocation } from 'react-router-dom';

type Text = MessageDescriptor | string;

interface Breadcrumb {
  /**
   * The URL represented by the breadcrumb.
   */
  url: string;

  /**
   * The page title represented by the breadcrumb.
   */
  title: string;

  /**
   * The page description represented by the breadcrumb.
   */
  description: string;
}

type SetMeta = (depth: number, breadcrumb?: Breadcrumb) => void;
type ContextType = [number, SetMeta];

const MetaContext = createContext<ContextType>([0, noop]);
const BreadcrumbContext = createContext<Breadc