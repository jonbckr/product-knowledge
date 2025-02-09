//
// Main logic of the skill framework
// See copyright notice in the top folder
// See authors file in the top folder
// See license file in the top folder
//

import fetch from 'node-fetch';
import { RequestInit } from 'node-fetch';
import createHttpsProxyAgent from 'https-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ASSETS, SEARCH_RESULT } from './mock_data';
export { getOntologyHubFactory, OntologyResult } from './ontology_hub';

/*
 * a connector factory
 */
export interface IConnectorFactory {
  create: () => IConnector;
}

/**
 * the connector interface
 */
export interface IConnector {
  /**
   * function to list all assets of the default catalogue through this connector
   * the providerUrl is an optional parameter (means that we will look for the local catalogue)
   */
  execute: (skill: string, queryVariables: JSONElement) => Promise<BindingSet>;
}

/**
 * an EDC (Federated) Catalogue
 */
export interface Catalogue {
  /**
   * the id of the catalogue
   */
  id: string;
  /**
   * the list of offers
   */
  contractOffers: ContractOffer[];
}

/**
 * an EDC offer
 */
export interface ContractOffer {
  /**
   * id of the offer
   */
  id: string;
  /**
   * optional id of the associated policy
   */
  policyId?: string;
  /**
   * optional id of the associated artifact/asset
   */
  assetId?: string | null;
  /**
   * the urn of the provider
   */
  provider: string;
  /**
   * the urn of the consumer
   */
  consumer: string;
  /**
   * if this offer is temporarily restricted: the start of the offer
   */
  offerStart?: string | null;
  /**
   * if this offer is temporarily restricted: the end of the offer
   */
  offerEnd?: string | null;
  /**
   * if the contract associated to this offer is temporarily restricted: the start of the contract
   */
  contractStart?: string | null;
  /**
   * if the contract associated to this offer is temporarily restricted: the end of the contract
   */
  contractEnd?: string | null;
  /**
   * the policy of the offer
   */
  policy: Policy;
  /**
   * the asset description of the offer
   */
  asset: Asset;
}
type JSONElement = JSONObject | JSONArray;
type JSONArray = Array<JSONValue>;
type JSONValue = string | number | boolean | JSONElement;

interface JSONObject {
  [x: string]: JSONValue;
}

/**
 * a connector policy
 */
interface Policy {
  /** unique id of the policy */
  uid?: string | null;
  /** a set of permissions */
  permissions: Condition[];
  /** a set of prohibitions */
  prohibitions: Condition[];
  /** a set of obligations */
  obligations: Condition[];
  /** this is extensible */
  extensibleProperties?: JSONObject;
  /** policies may inherit from each other, this would be the uid of the parent policy if so */
  inheritsFrom?: string | null;
  /** the assigner of the policy */
  assigner?: string | null;
  /** the assignee of the policy */
  assignee?: string | null;
  /** the target of the policy (if restricted) */
  target?: string | null;
  /** the type of the policy */
  '@type': PolicyTypeObject;
}

/**
 * different policy types
 * TODO wtf is that a set versus singelton or the policy is "set"/"get"?*/
export enum PolicyType {
  /** set or set */
  set = 'set',
}

/**
 * an object describing the policy type further
 */
interface PolicyTypeObject {
  /** references the type */
  '@policytype': PolicyType;
}

/**
 * an invividual permission, obligation or prohibition
 */
interface Condition {
  /**
   * type of condition
   * TODO maybe we need an enum here
   */
  edctype: string;
  /**
   * condition may have a unique identifier
   */
  uid?: string | null;
  /**
   * a target of the condition
   */
  target: string;
  /**
   * the action that is permitted/prohibited or obliged
   */
  action: Action;
  /**
   * assignee of the condition
   */
  assignee?: string | null;
  /**
   * assigner of the condition
   */
  assigner?: string | null;
  /** a set of constraints on the condition */
  constraints: Constraint[];
  /** a set of duties attached to the condition */
  duties: Constraint[];
}

/**
 * different types of actions
 * TODO insert graph actions
 */
export enum ActionType {
  /** do what you want with it */
  USE = 'USE',
}

/**
 * an action in a condition
 */
export interface Action {
  /** type of action */
  type: ActionType;
  /** TODO wtf */
  includedIn?: string | null;
  /** an action may also directly have a constraint */
  constraint?: Constraint | null;
}

/**
 * TODO need to define constraints
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Constraint {}

/**
 * this is an asset description
 */
export interface Asset {
  /** just a flexible property container */
  properties: AssetProperties;
}
/**
 * the different types of endpoints/data planes supported
 */
export declare enum DataAddressEndpointType {
  /** http data plane */
  HttpData = 'HttpData',
  /** Sparql subprotocol */
  Sparql = 'urn:cx:Protocol:w3c:Http#SPARQL',
}

/**
 * the flexible properties of an asset
 */
export interface AssetProperties {
  /** clear name of the asset  */
  'asset:prop:name'?: string | null;
  /** content type TODO use enum or media type  */
  'asset:prop:contenttype': string;
  /** optional size */
  'ids:byteSize'?: number | null;
  /** version of the asset descriptor */
  'asset:prop:version'?: string | null;
  /** id of the asset */
  'asset:prop:id': string;
  /** optional filename when downloading */
  'ids:fileName'?: string | null;
  /** a policy may be referenced directly  */
  'asset:prop:policy-id'?: string;
  /** whether its a federated asset */
  'cx:isFederated'?: boolean | null;
  /** asset description */
  'asset:prop:description'?: string | null;
  /** asset filename */
  'asset:prop:fileName'?: string | null;
  /** asset ontology */
  'rdfs:isDefinedBy'?: string | null;
  /** asset self-description in SHACL */
  'cx:shape'?: string | null;
  /** query subprotocol */
  'cx:protocol'?: DataAddressEndpointType | null;
  /** asset type */
  'rdf:type'?: string | null;
}

/**
 * this is an artifact (complete description of asset and address part)
 */
export interface Artifact {
  /** links an asset description */
  asset: Asset;
  /** with a data address description */
  dataAddress: DataAddress;
}

/**
 * this is a dataaddress
 */
export interface DataAddress {
  /** just a flexible container of properties */
  properties: DataAddressProperties;
}

/**
 * the flexible properties of a data address
 */
export interface DataAddressProperties {
  /** link to the backend system interfaced */
  endpoint: string;
  /** type of data plane attached */
  type: DataAddressEndpointType;
}

/**
 * Implementation of a mock connector
 */
class MockConnector implements IConnector {
  //execute
  public execute(
    skill: string,
    queryVariables: JSONElement
  ): Promise<BindingSet> {
    if (skill === 'Dataspace') return Promise.resolve(ASSETS);
    return Promise.resolve(SEARCH_RESULT);
  }
}

/**
 * mock connector factory
 */
export class EnvironmentConnectorFactory implements IConnectorFactory {
  private environmentConnector: IConnector;

  constructor() {
    if (
      process.env.REACT_APP_SKILL_CONNECTOR_CONTROL != undefined &&
      process.env.REACT_APP_SKILL_CONNECTOR_DATA != undefined &&
      process.env.REACT_APP_SKILL_CONNECTOR_CONTROL != '' &&
      process.env.REACT_APP_SKILL_CONNECTOR_DATA != ''
    ) {
      this.environmentConnector = new RemoteConnector(
        process.env.REACT_APP_SKILL_CONNECTOR_CONTROL,
        process.env.REACT_APP_SKILL_CONNECTOR_DATA,
        undefined,
        process.env.REACT_APP_SKILL_PROXY
      );
    } else {
      this.environmentConnector = new MockConnector();
    }
  }

  public create() {
    return this.environmentConnector;
  }
}

interface IRealmMappingFactory {
  create: () => IRealmMapping;
}
interface HeaderRecord {
  [key: string]: string;
}

interface IRealmMapping {
  getHeaderAnnotation: (targetDomain: string) => HeaderRecord;
}

class EnvironmentRealmMappingFactory implements IRealmMappingFactory {
  private environmentRealmMapping: IRealmMapping;

  constructor() {
    this.environmentRealmMapping = new EnvironmentRealmMapping();
  }

  public create() {
    return this.environmentRealmMapping;
  }
}

class EnvironmentRealmMapping implements IRealmMapping {
  public getHeaderAnnotation() {
    const headers: HeaderRecord = {};
    if (process.env.REACT_APP_SKILL_CONNECTOR_AUTH_HEADER_KEY != undefined) {
      headers[process.env.REACT_APP_SKILL_CONNECTOR_AUTH_HEADER_KEY] =
        process.env.REACT_APP_SKILL_CONNECTOR_AUTH_HEADER_VALUE ?? '';
    }
    return headers;
  }
}

/**
 * global factory variable
 */
let realmMappingFactory: IRealmMappingFactory =
  new EnvironmentRealmMappingFactory();

/**
 * @returns the global connector factory
 */
export const getRealmMappingFactory = function () {
  return realmMappingFactory;
};

/**
 * sets
 * @param factory the new global factory
 */

export const setRealmMappingFactory = function (factory: IRealmMappingFactory) {
  realmMappingFactory = factory;
};

export interface BindingSet {
  head: Head;
  results: Binding;
}

interface Head {
  vars: string[];
}

interface Binding {
  bindings: Entry[];
}

export interface Entry {
  [key: string]: Value | undefined;
}

interface Value {
  value: string;
  type: string;
}

/**
 * Implementation of a remote connector
 */
class RemoteConnector implements IConnector {
  private url: string;
  private data_url: string;
  private realmMapping: IRealmMapping;
  private proxy?: HttpsProxyAgent;

  constructor(
    url: string,
    data_url: string,
    realmMapping?: IRealmMapping,
    proxy?: string
  ) {
    this.url = url;
    this.data_url = data_url;
    this.realmMapping = realmMapping ?? getRealmMappingFactory().create();
    if (proxy) {
      const url = new URL(proxy);
      this.proxy = createHttpsProxyAgent({
        host: url.hostname,
        port: url.port,
      });
    }
  }

  //Execute Query
  public async execute(
    skill: string,
    queryVariable: JSONElement
  ): Promise<BindingSet> {
    const start = new Date().getTime();

    const skillUrl = '/api/agent?asset=urn:cx:Skill:consumer:' + skill;
    let parameters = '';
    let parametersContainer = '';
    let queryVariables: JSONArray = [];

    if (Array.isArray(queryVariable)) {
      queryVariables = queryVariable;
    } else {
      queryVariables = [queryVariable];
    }

    queryVariables.forEach((query) => {
      Object.entries(query).forEach(
        ([key, value]) => (parameters = `${parameters}&${key}=${value}`)
      );
      parameters = parameters.replace(/^&/, '');
      parametersContainer = parametersContainer + '&(' + parameters + ')';
      parameters = '';
    });

    const finalUrl = this.data_url + skillUrl + parametersContainer;

    const fetchOpts: RequestInit = {
      method: 'GET',
      headers: this.realmMapping.getHeaderAnnotation(this.url),
      agent: this.proxy,
    };

    //Response
    const response = await fetch(finalUrl, fetchOpts);

    const elapsed = new Date().getTime() - start;

    // eslint-disable-next-line no-console
    console.log(
      `Result from Remote Connector finished after ${elapsed} milliseconds.`
    );

    if (!response.ok) {
      throw new Error(`Error! status: ${response.status}`);
    }

    //result: BindingSet
    const result = (await response.json()) as BindingSet;

    return result;
  }
}

/**
 * global factory variable
 */
let connectorFactory: IConnectorFactory = new EnvironmentConnectorFactory();

/**
 * @returns the global connector factory
 */
export const getConnectorFactory = function () {
  return connectorFactory;
};

/**
 * sets
 * @param factory the new global factory
 */

export const setConnectorFactory = function (factory: IConnectorFactory) {
  connectorFactory = factory;
};

/**
 * @returns url of the skill backend
 */
export const getSkillBackend = function () {
  return (
    process.env.REACT_APP_SKILL_BACKEND ?? 'https://service.tib.eu/webvowl/'
  );
};
