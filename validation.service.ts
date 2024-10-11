import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';

export class ValidatorsService {
  constructor() {}

  static updateForm(
    group: FormGroup | FormControl | FormArray | AbstractControl,
    values: any
  ) {
    if (group instanceof FormControl) {
      group.setValue(values);
    } else if (group instanceof FormGroup) {
      Object.keys(group.controls).forEach((k) => {
        const control = group.get(k);
        if (values && values[k] !== undefined) {
          ValidatorsService.updateForm(control!, values[k]);
        }
      });
    } else if (group instanceof FormArray) {
      group.controls.forEach((c, index) => {
        if (values[index] !== undefined) {
          ValidatorsService.updateForm(c, values[index]);
        }
      });
    }
  }

  static error(errors: any, fieldName: string = 'Field') {
    if (!errors) return null;
    for (let propertyName in errors) {
      if (errors.hasOwnProperty(propertyName)) {
        return ValidatorsService.getValidatorErrorMessage(propertyName, {
          ...errors[propertyName],
          fieldName,
        });
      }
    }
    return null;
  }

  static getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
    let config: any = {
      fieldRequired: `This field is required.`,
      required: `Please enter ${
        validatorValue.fieldName ? `${validatorValue.fieldName}` : ''
      }`,
      verifyRequired: `Please  ${
        validatorValue.fieldName
          ? `${validatorValue.fieldName}`.toLowerCase()
          : ''
      }`,
      invalid: `Please enter valid ${
        validatorValue.fieldName
          ? `${validatorValue.fieldName}`.toLowerCase()
          : ''
      }`,
      selectRequired: `Please select  ${
        validatorValue.fieldName ? validatorValue.fieldName : ''
      } `,
      compare: 'Passwords do not match',
      min: `Minimum value required ${
        validatorValue.min ? validatorValue.min : ''
      }`,
      max: `Maximum value should be ${
        validatorValue.max ? validatorValue.max : ''
      }`,
      maxlength: `Maximum word limit reached`,
      minlength: `Minimum ${
        validatorValue.requiredLength ? validatorValue.requiredLength : ''
      } characters are required`,
      // 'phonelength': 'Phone number should be between 7-10 digits',
      emailAlreadyExsist: 'Email address is already exsist.',
      invalidPercentage: `Please enter valid percentage.`,
      phonelength: 'Please enter valid contact number',
      invalidName: 'Enter a valid name',
      invalidEmailAddress: 'Invalid email address',
      // invalidPassword: 'Please enter password with at least 6 characters',
      invalidPassword:
        'Must be 6 characters with at least one upper and one lowercase letter, one numeric digit, and one special character.',
      invalidNumber: 'Enter positive numeric values only',
      invalidPhoneNumber: 'Please enter valid contact number',
      invalidCardNumber: 'Please enter a valid credit/debit card number',
      invalidCVVNumber: 'Enter a valid CVV code',
      invalidCardExpiry: 'Invalid expiry date',
      invalidUrl: 'Enter a valid URL',
      invalidTaxId: 'Enter a valid TaxId',
      invalidFaxNumber: 'Enter a valid fax number',
      invalidZip: 'Please enter a valid zip code',
      invalidInput: 'Blank space is not allowed',
      invalidNumberInput: 'Minimum correct answer should be greater than 0',
      invalidNumberInput2: 'Number should be greater than 0',
      timeOverLap: 'Time should not be overlaps.',
      timeNotInEventRange: `${
        validatorValue.fieldName ? validatorValue.fieldName : 'Time'
      } should be in event time range.`,
      endTimeBeforeStartTime: `${
        validatorValue.fieldName ? validatorValue.fieldName : 'End time'
      } should be greater than start time.`,
      invalidGoal: 'Please enter valid goal. ',
      invalidYouTube: 'Please enter a valid youtube url',
      invalidAccountNumber: 'Please enter a valid account number',
      invalidEmployeeId: 'Please enterzeroNotAllowed valid format',
      specialCharacter:
        'Letter, Numbers & Special characters -Hyphen & Underscore is allowed, No other special character allowed.',
      price: `Please enter valid ${
        validatorValue.fieldName ? validatorValue.fieldName.toLowerCase() : ''
      }.`,
      otpLength: 'Fill the complete OTP to verify',
      NumberLength: 'Please enter valid contact number',
      oneSpecialCharacter: `Password must contain at least one special character.`,
    };
    return config[validatorName];
  }

  static required(control: AbstractControl) {
    if (control.value == null || control.value == undefined) {
      return { required: true };
    }
    return null;
  }

  static fieldRequired(control: AbstractControl) {
    if (!control.value) {
      return { fieldRequired: true };
    }
    return null;
  }

  static verifyRequired(control: AbstractControl) {
    if (!control.value) {
      return { verifyRequired: true };
    }
    return null;
  }

  static selectRequired(control: AbstractControl) {
    if (!control.value) {
      return { selectRequired: true };
    }
    return null;
  }

  static compareValidator(control1: string, control2: string): ValidatorFn {
    return function matchPassword(c: AbstractControl) {
      if (
        c.get(control1)?.value &&
        c.get(control2)?.value &&
        c.get(control1)?.value !== c.get(control2)?.value
      ) {
        c.get(control2)?.setErrors({ compare: true });
        return { invalid: true };
      } else {
        // c.get(control2)?.setErrors();
        return null;
      }
    };
  }

  static spaceValidator(control: any) {
    if (control.value) {
      let v = `${control.value}`;
      if (v.replace(/\s+/g, '')) {
        return null;
      } else {
        return { invalidInput: true };
      }
    }
    return null;
  }

  static zeroValidator(control: any) {
    if (control.value) {
      if (control.value > 0) {
        return null;
      } else {
        return { invalidNumberInput: true };
      }
    }
    return null;
  }

  static zeroValidator2(control: any) {
    if (control.value) {
      if (control.value > 0) {
        return null;
      } else {
        return { invalidNumberInput2: true };
      }
    }
    return null;
  }

  static numberFieldRequiredValidator(control: any) {
    if (control.value) {
      return null;
    } else {
      return { required: true };
    }
  }

  static employeeId(control: any) {
    // RFC 2822 compliant regex
    if (control.value) {
      if (`${control.value}`.match(/^(\w+)?\d+(\w+)?$/)) {
        return null;
      } else {
        return { invalidEmployeeId: true };
      }
    }
    return null;
  }

  static price(control: any) {
    const isValid = `${control.value}`.match(/[1-9]+(\0?\\.[0-9][0-9]?)?/);
    if (isValid?.length) {
      return null;
    } else {
      return { price: true };
    }
  }

  static specailCharacter(control: any) {
    // RFC 2822 compliant regex
    if (control.value) {
      if (`${control.value}`.match(/^[0-9a-zA-Z-_]+$/)) {
        return null;
      } else {
        return { specialCharacter: true };
      }
    }
    return null;
  }

  static fullNameValidator(control: any) {
    // RFC 2822 compliant regex
    if (control.value) {
      let str = control.value.replace(/\s+/g, '');

      if (
        control.value.match(/^([a-z])+([a-zA-Z0-9 .,-@&#!\'\\$\\s]*)$/i) &&
        str.length > 0
      ) {
        return null;
      } else {
        return { invalidName: true };
      }
    }
    return null;
  }

  static OtpLength(control: AbstractControl) {
    if (control.value) {
      let str = control.value.replace(/\s+/g, '');
      if (str.length >= 4) {
        return null;
      } else {
        return { otpLength: true };
      }
    }
    return null;
  }

  static nameValidator(control: any) {
    // RFC 2822 compliant regex
    if (control.value) {
      let str = control.value.replace(/\s+/g, '');

      if (
        control.value.match(/^([a-z])+([a-zA-Z0-9 .,-@&#!\'\\$\\s]*)$/i) &&
        str.length > 0
      ) {
        return null;
      } else {
        return { invalidName: true };
      }
    }
    return null;
  }

  static emailValidator(control: any) {
    // RFC 2822 compliant regex
    if (control.value) {
      if (
        control.value.match(
          /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|glass|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i
        )
      ) {
        return null;
      } else {
        return { invalidEmailAddress: true };
      }
    }
    return null;
  }

  static setEmailValidator(control: any) {
    if (control.value) {
      if (
        control.value.match(
          /^\b[A-Za-z0-9._%+-]+@(tel\.com|us\.tel\.com|teqmavens\.com)\b$/
        )
      ) {
        return null;
      } else {
        return { invalidEmailAddress: true };
      }
    }
    return null;
  }

  static numberValidator(control: any) {
    const value = `${control.value}`;
    if (value && value.match(/^[0-9]*$/)) {
      return null;
    } else {
      return { invalidNumber: true };
    }
  }

  static percentageValidator(control: any) {
    const value: string = `${control.value}`;
    if (value) {
      if (
        value.match(/(^100(\.0{1,2})?$)|(^([1-9]([0-9])?|0)(\.[0-9]{1,2})?$)/g)
      ) {
        return null;
      } else {
        return { invalidPercentage: true };
      }
    }
    return null;
  }

  static phoneNumberValidator(control: any) {
    if (control.value) {
      if (control.value.match(/^\d{15}$/)) {
        return null;
      } else if (
        control.value.match(
          /^(\+\d{1,3}[- ]?)?\(?([0-15]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
        )
      ) {
        return null;
      } else if (
        control.value.match(
          /^(\+\d{1,3}[- ]?)?\(?([0-9]{2})\)?[-. ]?([0-15]{4})[-. ]?([0-9]{4})$/
        )
      ) {
        return null;
      } else {
        return { invalidPhoneNumber: true };
      }
    }
    return null;
  }

  static phoneNumberWithoutDialCodeValidator(control: any) {
    if (control.value) {
      var p = `${control.value}`.match(/\d+/);
      if (`${control.value}`.match(/^\d{10,10}$/)) {
        return null;
      } else if (p && p?.length < 7) {
        return { phonelength: true };
      } else {
        return { invalidPhoneNumber: true };
      }
    }
    return null;
  }

  static phoneMinLength(control: AbstractControl) {
    if (control.value) {
      let str = control.value.replace(/\s+/g, '');
      if (str.length >= 7) {
        return null;
      } else {
        return { NumberLength: true };
      }
    }
    return null;
  }
  static validPhone(control: AbstractControl) {
    if (control.value) {
      if (/^[0-9]{10}$/.test(control.value)) {
        return null;
      } else {
        return { invalidPhoneNumber: true };
      }
    }
    return null;
  }

  static isLengthMet(control: any) {
    // {6,100}           - Assert password is between 6 and 100 characters
    // (?=.*[0-9])       - Assert a string has at least one number
    const value = `${control.value}`;
    if (value) {
      if (value.match(/\s/g)) {
        return { invalidInput: true };
      }
      if (value.match(/.{7,}$/)) {
        return null;
      } else {
        return { invalidPassword: true };
      }
    }
    return null;
  }

  // static passwordValidator(control: any) {
  //   // {6,100}           - Assert password is between 6 and 100 characters
  //   // (?=.*[0-9])       - Assert a string has at least one number
  //   const value = `${control.value}`;
  //   if (value) {
  //     if (value.match(/\s/g)) {
  //       return { invalidInput: true };
  //     }
  //     if (value.match(/^[a-zA-Z0-9!@#$%^&*]{6,100}$/)) {
  //       return null;
  //     } else {
  //       return { invalidPassword: true };
  //     }
  //   }
  //   return null;
  // }

  static passwordValidator(control: any) {
    // {6,100}           - Assert password is between 6 and 100 characters
    // (?=.*[0-9])       - Assert a string has at least one number
    const value = `${control.value}`;
    if (value) {
      if (value.match(/\s/g)) {
        return { invalidInput: true };
      }
      if (
        value.match(
          '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,})'
        )
      ) {
        return null;
      } else {
        return { invalidPassword: true };
      }
    }
    return null;
  }

  static urlValidator(control: any) {
    if (control.value) {
      if (
        control.value.match(
          /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/g
        )
      ) {
        return null;
      } else {
        return { invalidUrl: true };
      }
    }
    return null;
  }

  static isSpecialCharMet(control: any) {
    if (control.value) {
      if (control.value.match(/[!@#$%*<.,]/)) {
        return null;
      } else {
        return { oneSpecialCharacter: true };
      }
    }
    return null;
  }
}
