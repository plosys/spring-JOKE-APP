
import { Utils } from '@appsemble/sdk';
import { remap } from '@appsemble/utils';

import { Field, Values } from '../../block.js';
import { generateDefaultValidity } from './generateDefaultValidity.js';

describe('generate default validity', () => {
  it('should return an empty error map', () => {
    let fields: Field[];
    const data: Values = {};
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {};

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as Utils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({});
  });

  it('should see field as pristine', () => {
    const fields = [
      {
        type: 'string',
        name: 'a',
      },
    ] as Field[];
    const data: Values = {
      a: '',
    };
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {
      a: '',
    };

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as Utils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({});
  });

  it('should see field value as invalid', () => {
    const fields = [
      {
        type: 'string',
        name: 'a',
        requirements: [{ required: true }],
      },
    ] as Field[];
    const data: Values = {
      a: '',
    };
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {
      a: '',
    };

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as Utils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({ a: 'the value is invalid' });
  });

  it('should validate child fields in fieldset', () => {
    const fields = [
      {
        type: 'fieldset',
        name: 'a',
        fields: [
          {
            type: 'string',
            name: 'b',
          },
          {
            type: 'string',
            name: 'c',
            requirements: [{ required: true }],
          },
          {
            type: 'fieldset',
            name: 'd',
            fields: [
              {
                type: 'string',
                name: 'e',
              },
              {
                type: 'string',
                name: 'f',
                requirements: [{ required: true }],
              },
              {
                type: 'string',
                name: 'g',
                requirements: [{ required: true }],
              },
            ],
          },
        ],
      },
    ] as Field[];
    const data: Values = {
      a: {
        b: '',
        c: '',
        d: {
          e: '',
          f: '',
          g: 'value',
        },
      },
    };
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {
      a: {
        b: '',
        c: '',
        d: {
          e: '',
          f: '',
        },
      },
    };

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as Utils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({
      a: { c: 'the value is invalid', d: { f: 'the value is invalid' } },
    });
  });

  it('should validate child fields in repeated fieldset', () => {
    const fields = [
      {
        type: 'fieldset',
        name: 'a',
        repeated: true,
        fields: [
          {
            type: 'string',
            name: 'b',
          },
          {
            type: 'string',
            name: 'c',
            requirements: [{ required: true }],
          },
          {
            type: 'fieldset',
            name: 'd',
            repeated: true,
            fields: [
              {
                type: 'string',
                name: 'e',
              },
              {
                type: 'string',
                name: 'f',
                requirements: [{ required: true }],
              },
              {
                type: 'string',
                name: 'g',
                requirements: [{ required: true }],
              },
            ],
          },
        ],
      },
    ] as Field[];
    const data: Values = {
      a: [
        {
          b: '',
          c: '',
          d: [{ e: '', f: '', g: 'value' }],
        },
      ],
    };
    const defaultError = 'the value is invalid';
    const defaultValues: Values = {
      a: [],
    };

    const errors = generateDefaultValidity(
      fields,
      data,
      { remap } as unknown as Utils,
      defaultError,
      defaultValues,
    );
    expect(errors).toStrictEqual({
      a: [
        {
          c: 'the value is invalid',
          d: [{ f: 'the value is invalid' }],
        },
      ],
    });
  });
});