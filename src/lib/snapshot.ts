import { SecurityHelpers } from './types';
import { RefService } from './ref';

export class DataSnapshot {

  private data: any;
  private ref: RefService;

  constructor(input: RefService | any, securityHelpers?: SecurityHelpers) {
    if (input instanceof RefService) {
      this.ref = input;
    } else {
      this.data = input;
    }
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
    if (!!this.ref) {
      // @ts-ignore
      return this.ref.data();
    } else {
      return this.data;
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

  // prop exists
  exists(prop: string) {
    const data = this.val();
    return (
      !!prop &&
      (!!data && data instanceof Object) &&
      !!data[prop]
    );
  }

  // prop not exists
  notExists(prop: string) {
    const data = this.val();
    return (
      !prop ||
      (
        (!!data && data instanceof Object) &&
        !data[prop]
      )
    );
  }

}