import React, { useMemo } from 'react';
import { Accordion, Button, Col, Form, Row, Stack } from 'react-bootstrap';
import type { ReferenceOption, SearchQuery } from './SearchBar';

type FiltersBarProps = {
  query: SearchQuery;
  onQueryChange: (partial: Partial<SearchQuery>) => void;
  availableMediaTypes: ReferenceOption[];
  availableCollections: ReferenceOption[];
  availablePeople: ReferenceOption[];
  availableTags: ReferenceOption[];
  onReset: () => void;
};

const FiltersBar = ({
  query,
  onQueryChange,
  availableMediaTypes,
  availableCollections,
  availablePeople,
  availableTags,
  onReset,
}: FiltersBarProps) => {
  const sections = useMemo(
    () =>
      [
        {
          key: 'mediaTypes',
          title: 'Media Type',
          options: availableMediaTypes,
          selected: query.mediaTypes,
          type: 'checkbox' as const,
        },
        {
          key: 'collections',
          title: 'Collections',
          options: availableCollections,
          selected: query.collections,
          type: 'checkbox' as const,
        },
        {
          key: 'people',
          title: 'People',
          options: availablePeople,
          selected: query.people,
          type: 'checkbox' as const,
        },
        {
          key: 'tags',
          title: 'Tags',
          options: availableTags,
          selected: query.tags,
          type: 'checkbox' as const,
        },
      ] satisfies Array<{
        key: keyof Pick<SearchQuery, 'mediaTypes' | 'collections' | 'people' | 'tags'>;
title: string;
        options: ReferenceOption[];
        selected: string[];
        type: 'checkbox';
      }>,
    [availableCollections, availableMediaTypes, availablePeople, availableTags, query.collections, query.mediaTypes, query.people, query.tags]
  );

  const toggleValue = (field: keyof Pick<SearchQuery, 'mediaTypes' | 'collections' | 'people' | 'tags'>, value: string) => {
    const current = query[field];
    const exists = current.includes(value);
    const updated = exists ? current.filter((id) => id !== value) : [...current, value];
    onQueryChange({ [field]: updated } as Partial<SearchQuery>);
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange({ location: event.target.value });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onQueryChange({ [name]: value } as Partial<SearchQuery>);
  };

  return (
    <Accordion className="mt-3" defaultActiveKey="filters">
      <Accordion.Item eventKey="filters">
        <Accordion.Header>
          <div className="fw-semibold text-uppercase text-muted small">Filters</div>
        </Accordion.Header>
        <Accordion.Body className="bg-white rounded-bottom-3 shadow-sm border-top-0">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="small text-muted">Refine your results</div>
            <Button variant="link" size="sm" className="text-decoration-none p-0" onClick={onReset}>
              Reset all
            </Button>
          </div>
          <Row className="g-3 small">
            <Col lg={8} md={12}>
              <Accordion alwaysOpen flush>
                {sections.map((section) => (
                  <Accordion.Item eventKey={section.key} key={section.key}>
                    <Accordion.Header className="py-2">{section.title}</Accordion.Header>
                    <Accordion.Body className="py-2">
                      <div className="d-flex flex-wrap gap-3">
                        {section.options.length === 0 && <div className="text-muted">No options yet</div>}
                        {section.options.map((option) => (
                          <Form.Check
                            key={option.id}
                            inline
                            size="sm"
                            type={section.type}
                            id={`${section.key}-${option.id}`}
                            label={option.name}
                            checked={section.selected.includes(option.id)}
                            onChange={() => toggleValue(section.key as typeof section.key, option.id)}
                          />
                        ))}
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Col>
            <Col lg={4} md={12}>
              <Stack gap={2}>
                <Form.Group controlId="filter-date-range">
                  <Form.Label className="mb-1">Date range</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      size="sm"
                      type="date"
                      name="dateFrom"
                      value={query.dateFrom}
                      onChange={handleDateChange}
                    />
                    <Form.Control
                      size="sm"
                      type="date"
                      name="dateTo"
                      value={query.dateTo}
                      onChange={handleDateChange}
                    />
                  </div>
                </Form.Group>
                <Form.Group controlId="filter-location">
                  <Form.Label className="mb-1">Location</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="City, place, or venue"
                    value={query.location}
                    onChange={handleLocationChange}
                  />
                </Form.Group>
              </Stack>
            </Col>
          </Row>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default FiltersBar;