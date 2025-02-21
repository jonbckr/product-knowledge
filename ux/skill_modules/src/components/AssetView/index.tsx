import React, { useEffect, useState } from 'react';
import './styles.sass';
import { GridRowModel } from '@mui/x-data-grid';
import { Grid, Tooltip } from '@mui/material';
import { IconButton, Table } from 'cx-portal-shared-components';
import Typography from '@mui/material/Typography';
import { getConnectorFactory, Entry } from '../..';
import EmptyResultBox from '../EmptyResultBox';
import InsightsIcon from '@mui/icons-material/Insights';
import CatchingPokemonIcon from '@mui/icons-material/CatchingPokemon';
import EastIcon from '@mui/icons-material/East';

interface AssetViewProps {
  filter?: string;
  onShowOntologies: (urls: string) => void;
}
export const AssetView = ({ filter, onShowOntologies }: AssetViewProps) => {
  const [rows, setRows] = useState<Entry[]>();

  useEffect(() => {
    const connector = getConnectorFactory().create();
    connector.execute('Dataspace', {}).then((catalogue) => {
      let data = catalogue.results.bindings;
      if (filter && filter?.length > 0) {
        data = catalogue.results.bindings.filter((entry) =>
          getRowValue(entry, 'isDefinedBy').includes(filter)
        );
      }
      setRows(data);
    });
  }, [filter]);

  const getRowValue = (row: Entry, key: string): string => {
    const value = row[key];
    return value ? value.value : '';
  };

  const columns = [
    {
      field: 'connector',
      flex: 2,
      headerName: 'Connector',
      renderCell: ({ row }: { row: Entry }) =>
        getRowValue(row, 'connector').split('/').slice(-1),
    },
    {
      field: 'asset',
      flex: 2,
      headerName: 'Asset',
      valueGetter: ({ row }: { row: Entry }) =>
        getRowValue(row, 'asset').split(':').slice(-1),
    },
    {
      field: 'name',
      flex: 3,
      headerName: 'Name',
      renderCell: ({ row }: { row: Entry }) => {
        const name = getRowValue(row, 'name');
        const description = getRowValue(row, 'description');
        return (
          <Tooltip title={description}>
            <span>{name}</span>
          </Tooltip>
        );
      },
    },
    {
      field: 'type',
      flex: 1,
      headerName: 'Type',
      renderCell: ({ row }: { row: Entry }) => {
        const iconType = getRowValue(row, 'type').split('#').slice(-1)[0];
        let value = <span>{iconType}</span>;
        if (iconType === 'GraphAsset') value = <InsightsIcon color="success" />;
        if (iconType === 'SkillAsset')
          value = <CatchingPokemonIcon color="success" />;
        return <Tooltip title={iconType}>{value}</Tooltip>;
      },
    },
    {
      field: 'isDefinedBy',
      flex: 2,
      headerName: 'Ontologies',
      valueGetter: ({ row }: { row: Entry }) =>
        getRowValue(row, 'isDefinedBy')
          .replace(/>/g, '')
          .split(',')
          .map((item) => item.split('/').slice(-1)[0].replace('.ttl', ''))
          .toString()
          .replace(/,/g, ', '),
    },
    {
      field: 'actions',
      flex: 1,
      headerName: 'Action',
      renderCell: ({ row }: { row: Entry }) => {
        if (getRowValue(row, 'isDefinedBy').length > 0) {
          return (
            <IconButton
              title="Jump to related Ontologies"
              onClick={() => onShowOntologies(getRowValue(row, 'isDefinedBy'))}
            >
              <EastIcon />
            </IconButton>
          );
        } else {
          return '';
        }
      },
    },
  ];
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography p={2} variant="h4">
          Asset List
        </Typography>
        {rows && rows.length > 0 ? (
          <Table
            title="Assets Result"
            rowsCount={rows.length}
            columns={columns}
            getRowHeight={() => 'auto'}
            rows={rows}
            getRowId={(row: GridRowModel) => row['asset'].value}
          />
        ) : (
          <EmptyResultBox />
        )}
      </Grid>
    </Grid>
  );
};
