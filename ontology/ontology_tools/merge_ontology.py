import os
from rdflib.namespace import RDF, RDFS, OWL, DC
from rdflib import Graph, URIRef, Literal
from datetime import date
import sys
from ontology.ontology_tools.settings import cx, cx_url, cx_file, mapping_path

def merge_ontology(path='ontology', folder = 'ontology', file_out = 'cx_ontology.ttl', files = None):

    # get file list
    if (files is None):
        files = os.listdir(folder)

    files.sort()

    # start
    g = Graph()
    for file in files:
        if ((not file.startswith('.')) & file.endswith('_ontology.ttl') ) & (file != file_out):
            ttl_file = path+'/'+file
            if os.path.exists(ttl_file):
                # read & merge ontology
                graph = Graph().parse(ttl_file)
                # remove ontology annotations
                if (None, RDF['type'], OWL['Ontology']) in graph:
                    ontology = graph.value(None, RDF.type, OWL.Ontology)
                    graph = graph.remove((ontology, None, None))
                print('# merging: ', ttl_file)
                g = g + graph

    # add meta data
    ontology_iri = 'CxOntology'
    g = g.add((cx[ontology_iri], RDF.type, OWL.Ontology))
    g = g.add((cx[ontology_iri], DC.title, Literal('Catena-X Ontology')))
    g = g.add((cx[ontology_iri], DC.date, Literal(date.today())))
    g = g.add((cx[ontology_iri], DC.creator, Literal('Catena-X Knowledge Agents Team')))
    g = g.add((cx[ontology_iri], DC.description, Literal('Catena-X Ontology for the Autmotive Industry.')))
    #g = g.add((cx[ontology_iri], RDFS.seeAlso, URIRef('https://github.com/catenax-ng/product-knowledge/blob/main/ontology/')))

    # write
    print('# writing: ', folder+'/'+file_out)
    g.serialize(destination=folder+'/'+file_out, format='turtle')

if __name__ == '__main__':
  merge_ontology(files=sys.argv[1:])