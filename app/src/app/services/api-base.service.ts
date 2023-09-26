import { Injectable } from '@angular/core';

import config from '../../assets/config.json';

@Injectable({
  providedIn: 'root'
})
export class ApiBaseService {

  // default init to be overridden by config value
  apiBaseUrl: string = 'http://0.0.0.0:8050';

  constructor() { }

  public getApiBase(): string {
    if (config.apiBaseUrl)
      return config.apiBaseUrl;
    else
      return this.apiBaseUrl;
  }
}
