import React from "react";
import PropTypes from "prop-types";
import { Form, Row, Col, Select, Input, InputNumber } from "antd";
import { getAssertion } from "./helpers";

const Option = Select.Option,
      FormItem = Form.Item;

export class AssertBoundingBox extends React.Component {

  static propTypes = {
    record: PropTypes.object.isRequired,
    targets: PropTypes.arrayOf( PropTypes.object ),
    form: PropTypes.shape({
      setFieldsValue: PropTypes.func.isRequired,
      getFieldDecorator: PropTypes.func.isRequired
    })
  }

  onSelectAssertion = ( value ) => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ operator: value });
  }


  state = {
    x: "any",
    y: "any",
    w: "any",
    h: "any"
  }

  onSwitchChange( value, param ) {
    this.setState({
      [ param ]: value
    });
  }

  componentDidMount() {
    const { hOperator, wOperator, xOperator, yOperator } = getAssertion( this.props.record );
    this.setState({
      x: xOperator || "any",
      y: yOperator || "any",
      w: wOperator || "any",
      h: hOperator || "any"
    });
  }


  render () {
    const { getFieldDecorator } = this.props.form,
          { record } = this.props,
          state = this.state,
          { hOperator, hValue, wOperator, wValue, xOperator, xValue, yOperator, yValue } = getAssertion( record );

    return (
      <React.Fragment>
        <Row className="is-invisible">
          <Col span={8} >
            <FormItem label="Expected result">
              { getFieldDecorator( "assert.assertion", {
                initialValue: "boundingBox",
                rules: [{
                  required: true
                }]
              })( <Input readOnly /> ) }
            </FormItem>
          </Col>
        </Row>


        <Row className="ant-form-inline">

          <div className="ant-row ant-form-item ant-form-item--like-input">
            <b>x</b> is
          </div>

          <FormItem>
            { getFieldDecorator( "assert.xOperator", {
              initialValue: xOperator || "any",
              rules: [{
                required: true
              }]
            })( <Select style={{ width: 64 }} onChange={ ( e ) =>  this.onSwitchChange( e, "x" ) }>
              <Option value="any">any</Option>
              <Option value="gt">&gt;</Option>
              <Option value="lt">&lt;</Option>
            </Select> ) }
          </FormItem>


          { state.x !== "any" && <FormItem>
            { getFieldDecorator( "assert.xValue", {
              initialValue: xValue,
              rules: [{
                required: true
              }]
            })( <InputNumber /> )
            }
          </FormItem> }

        </Row>

        <Row className="ant-form-inline">

          <div className="ant-row ant-form-item ant-form-item--like-input">
            <b>y</b> is
          </div>

          <FormItem>
            { getFieldDecorator( "assert.yOperator", {
              initialValue: yOperator || "any",
              rules: [{
                required: true
              }]
            })( <Select style={{ width: 64 }} onChange={ ( e ) =>  this.onSwitchChange( e, "y" ) }>
              <Option value="any">any</Option>
              <Option value="gt">&gt;</Option>
              <Option value="lt">&lt;</Option>
            </Select> ) }
          </FormItem>

          { state.y !== "any" && <FormItem>
            { getFieldDecorator( "assert.yValue", {
              initialValue: yValue,
              rules: [{
                required: true
              }]
            })( <InputNumber /> )
            }
          </FormItem> }

        </Row>

        <Row className="ant-form-inline">

          <div className="ant-row ant-form-item ant-form-item--like-input">
            <b>width</b> is
          </div>

          <FormItem>
            { getFieldDecorator( "assert.wOperator", {
              initialValue: wOperator || "any",
              rules: [{
                required: true
              }]
            })( <Select style={{ width: 64 }} onChange={ ( e ) =>  this.onSwitchChange( e, "w" ) }>
              <Option value="any">any</Option>
              <Option value="gt">&gt;</Option>
              <Option value="lt">&lt;</Option>
            </Select> ) }
          </FormItem>

          { state.w !== "any" && <FormItem>
            { getFieldDecorator( "assert.wValue", {
              initialValue: wValue,
              rules: [{
                required: true
              }]
            })( <InputNumber /> )
            }
          </FormItem> }

        </Row>

        <Row className="ant-form-inline">

          <div className="ant-row ant-form-item ant-form-item--like-input">
            <b>height</b> is
          </div>

          <FormItem>
            { getFieldDecorator( "assert.hOperator", {
              initialValue: hOperator || "any",
              rules: [{
                required: true
              }]
            })( <Select style={{ width: 64 }} onChange={ ( e ) =>  this.onSwitchChange( e, "h" ) }>
              <Option value="any">any</Option>
              <Option value="gt">&gt;</Option>
              <Option value="lt">&lt;</Option>
            </Select> ) }
          </FormItem>

          { state.h !== "any" && <FormItem>
            { getFieldDecorator( "assert.hValue", {
              initialValue: hValue,
              rules: [{
                required: true
              }]
            })( <InputNumber /> )
            }
          </FormItem> }

        </Row>


      </React.Fragment> );
  }

}
