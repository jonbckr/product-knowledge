import pandas as pd
import os
from os.path import exists
from ontology.ontology_tools.settings import ontology_path, tables_path, tools_path, cx_url
from ontology.ontology_tools.convert_df2graph import convert_df2graph
from ontology.ontology_tools.merge_ontology import merge_ontology
from ontology.ontology_tools.convert_ontology_to_csv import convert_ontology_to_csv
from ontology.ontology_tools.write_formatted_excel import write_formatted_excel

# read mapping
mapping = pd.read_csv(tools_path + '/rdf_mapping.csv', dtype=str).dropna(how='all')
schema = mapping[(mapping['usage'] == 'schema') & mapping['order'].notna()]['simple_name'].to_list()

def create_ontology_table(domain='test', author='Max Mustermann', version = '0.0.1'):
    header = ['# prefix', '# namespace', '# title', '# version', '# author', '# contributor',
              '# description', '# import', '', '', 'class', 'class', 'relation', 'attribute']
    info = ['cx', cx_url, domain.replace('_', ' ') + ' ontology', version, author,
            '', '', 'common ontology', '', '', 'vehicle', 'engine', 'is part of', 'vehicle identification number']
    parents = ['', '', '', '', '', '', '', '', '', '', 'product', 'product', '', '']
    relation_from = ['', '', '', '', '', '', '', '', '', '', '', '', 'engine', 'vehicle']
    relation_to = ['', '', '', '', '', '', '', '', '', '', '', '', 'vehicle', 'xsd:string']
    df = pd.DataFrame({'type': header, 'identifier': info,
                       'parents': parents, 'relation_from': relation_from, 'relation_to': relation_to})
    # add empty columns
    for col in schema[5:]: # already included
        df[col] = ''
    excel_file = tables_path + '/' + domain.replace(' ', '_') + '_ontology.xlsx'
    if not exists(excel_file):
        print('# writing:', excel_file)
        write_formatted_excel(df, excel_file)
    else:
        print('# file already exists:', excel_file)

########################################################################################################################
def get_ontology_list(tables_path, file_ext='csv'):
    files = os.listdir(tables_path)
    files.sort()
    files = [file for file in files if file[0].isalpha() & file.endswith('_ontology.' + file_ext)]
    ontology_list = [file.replace('_ontology.' + file_ext, '') for file in files]
    print('# found nfiles:', len(files))
    return ontology_list

def convert_table_file(ontology, file_ext='xlsx'): # convert_table_file('vehice_component')
    ontology = ontology.replace(' ', '_')
    df = pd.read_excel(tables_path+'/'+ontology+'_ontology.'+file_ext, dtype=str).dropna(how='all').fillna('')  # necessary
    ttl_file = ontology_path + '/' + ontology + '_ontology.ttl'
    print('# converting: ', ttl_file)
    graph = convert_df2graph(df, mapping, ontology_name=ontology+'_ontology', prefix='cx', write_simple = False)
    graph.serialize(destination=ttl_file, format='turtle')

def convert_all_table_files(file_ext='xlsx'):
    for ontology in get_ontology_list(tables_path, file_ext=file_ext):
        convert_table_file(ontology, file_ext=file_ext)
########################################################################################################################

if __name__ == '__main__':
    convert_all_table_files()
    merge_ontology()
    convert_ontology_to_csv()
