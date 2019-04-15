import { SecurityHelpers } from './types';
import { RefService } from './ref';

export class DataSnapshot {

  private input: any;

  constructor(input: RefService | any, securityHelpers?: SecurityHelpers) {
    this.input = input;
    // add helpers
    if (!!securityHelpers) {
      for (const key of Object.keys(securityHelpers)) {
        const helper = securityHelpers[key];
        this[key] = () => helper(this);
      }
    }
  }

  // get data
  val() {
    if (this.input instanceof RefService) {
      return this.input['data']();
    } else {
      return this.input;
    }
  }

  // only props
  only(props = []) {
    const data = this.val();
    if (!props || !props.length) {
      return true;
    } else if (!!data && data instanceof Object) {
      const _data = { ... data };
      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        delete _data[prop];
      }
      return Object.keys(_data).length === 0;
    } else {
      return false;
    }
  }

}