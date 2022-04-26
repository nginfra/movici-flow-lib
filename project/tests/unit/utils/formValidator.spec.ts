import FormValidator, { ValidatorFunc } from '@movici-flow-common/utils/FormValidator';

describe('formValidator', () => {
  function newValidator(validators?: Record<string, ValidatorFunc>) {
    const onValidate = jest.fn();
    return { validator: new FormValidator({ validators: validators, onValidate }), onValidate };
  }
  it('returns empty dictionary on no errors', () => {
    const { validator, onValidate } = newValidator();
    validator.validate();
    expect(onValidate).toBeCalledWith({}, {});
  });

  it('can return multiple errors', () => {
    const { validator, onValidate } = newValidator({
      a: () => 'error a',
      b: () => 'error b'
    });
    validator.validate();
    expect(onValidate).toBeCalledWith(
      { a: 'error a', b: 'error b' },
      { _: { a: 'error a', b: 'error b' } }
    );
  });
  it('can add new validators', () => {
    const { validator, onValidate } = newValidator();
    validator.setValidator('new', () => 'error');
    validator.validate();
    expect(onValidate).toBeCalledWith({ new: 'error' }, { _: { new: 'error' } });
  });

  it('can add module', () => {
    const validator = new FormValidator();

    const onValidate = jest.fn();
    validator.addModule({
      name: 'module',
      validators: { key: () => 'error' },
      onValidate
    });
    validator.validate();
    expect(onValidate).toBeCalledWith({ key: 'error' }, { module: { key: 'error' } });
  });
  it('can remove a module', () => {
    const validator = new FormValidator();

    const onValidate = jest.fn();
    validator.addModule({
      name: 'module',
      validators: {},
      onValidate
    });
    validator.removeModule('module');
    validator.validate();
    expect(onValidate).not.toBeCalled();
  });
  it('removing a module clears errors', () => {
    const globalCallback = jest.fn();
    const validator = new FormValidator({
      onValidate: globalCallback,
      modules: [
        {
          name: 'module',
          validators: {
            key() {
              return 'error';
            }
          },
          onValidate: jest.fn()
        }
      ]
    });
    validator.validate();
    expect(globalCallback).toHaveBeenLastCalledWith({}, { module: { key: 'error' } });
    validator.removeModule('module');
    expect(globalCallback).toHaveBeenLastCalledWith({}, {});
  });
});
